import hashlib
import logging
import secrets
from datetime import datetime, timedelta, timezone

from app.errors.exceptions import AuthenticationError, ConflictError, NotFoundError, ValidationError
from app.extensions import db
from app.models.email_verification_token import EmailVerificationToken
from app.models.password_reset_token import PasswordResetToken
from app.models.user import User
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository
from app.services.password_service import PasswordService
from app.services.security_audit_service import SecurityAuditService
from app.services.token_service import TokenService

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self):
        self.user_repo = UserRepository()
        self.role_repo = RoleRepository()
        self.password_service = PasswordService()
        self.token_service = TokenService()
        self.security_audit = SecurityAuditService()

    def login(self, email, password, user_agent=None, ip_address=None):
        user = self.user_repo.get_by_email(email)
        if not user or not user.is_active:
            self.security_audit.log_event("LOGIN", "FAILURE", before_values={"email": email})
            raise AuthenticationError("Invalid credentials")

        if not self.password_service.verify_password(password, user.password_hash):
            self.security_audit.log_event("LOGIN", "FAILURE", user_id=user.id)
            raise AuthenticationError("Invalid credentials")

        # Transparent password hash upgrade
        if self.password_service.needs_rehash(user.password_hash):
            user.password_hash = self.password_service.hash_password(password)

        raw_session_token, session = self.token_service.create_session(
            user, user_agent=user_agent, ip_address=ip_address
        )
        token_bundle = self.token_service.generate_token_bundle(user, session.id)
        db.session.commit()

        self.security_audit.log_event("LOGIN", "SUCCESS", user_id=user.id)
        db.session.commit()

        logger.info("User logged in: %s", user.id)
        return token_bundle, raw_session_token

    def signup(self, name, email, password, confirm_password):
        if password != confirm_password:
            raise ValidationError("Passwords do not match")

        existing = self.user_repo.get_by_email(email)
        if existing:
            raise ConflictError("A user with this email already exists")

        password_hash = self.password_service.hash_password(password)
        user = User(
            name=name,
            email=email,
            password_hash=password_hash,
            email_verified=False,
        )

        borrower_role = self.role_repo.get_by_name("Borrower")
        if borrower_role:
            user.roles.append(borrower_role)

        self.user_repo.create(user)
        db.session.flush()

        # Create email verification token
        verification_token = self._create_verification_token(user.id)
        db.session.commit()

        self.security_audit.log_event("SIGNUP", "SUCCESS", user_id=user.id)
        db.session.commit()

        logger.info("User signed up: %s", user.id)
        return user, verification_token

    def forgot_password(self, email):
        user = self.user_repo.get_by_email(email)
        if not user:
            self.security_audit.log_event("FORGOT_PASSWORD", "NOT_FOUND", before_values={"email": email})
            db.session.commit()
            return None

        raw_token = secrets.token_hex(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

        reset_token = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
        )
        db.session.add(reset_token)
        db.session.commit()

        self.security_audit.log_event("FORGOT_PASSWORD", "SUCCESS", user_id=user.id)
        db.session.commit()

        logger.info("Password reset requested for user: %s", user.id)
        return raw_token

    def reset_password(self, token, password, confirm_password):
        if password != confirm_password:
            raise ValidationError("Passwords do not match")

        token_hash = hashlib.sha256(token.encode()).hexdigest()
        reset_token = PasswordResetToken.query.filter_by(token_hash=token_hash).first()

        if not reset_token or reset_token.is_used or reset_token.is_expired:
            raise AuthenticationError("Invalid or expired reset token")

        user = self.user_repo.get_by_id(reset_token.user_id)
        if not user:
            raise AuthenticationError("Invalid or expired reset token")

        user.password_hash = self.password_service.hash_password(password)
        user.session_version += 1
        reset_token.used_at = datetime.now(timezone.utc)

        # Revoke all sessions on password reset
        self.token_service.revoke_all_user_sessions(user.id)
        db.session.commit()

        self.security_audit.log_event("RESET_PASSWORD", "SUCCESS", user_id=user.id)
        db.session.commit()

        logger.info("Password reset completed for user: %s", user.id)

    def refresh(self, raw_session_token, user_agent=None, ip_address=None):
        session = self.token_service.verify_session(raw_session_token)
        if not session:
            raise AuthenticationError("Invalid or expired session")

        user = self.user_repo.get_by_id(session.user_id)
        if not user or not user.is_active:
            raise AuthenticationError("Invalid credentials")

        # Rotate: revoke old session, create new one
        self.token_service.revoke_session(session)
        new_raw_token, new_session = self.token_service.create_session(
            user, user_agent=user_agent, ip_address=ip_address
        )
        token_bundle = self.token_service.generate_token_bundle(user, new_session.id)
        db.session.commit()

        return token_bundle, new_raw_token

    def logout(self, raw_session_token):
        if raw_session_token:
            session = self.token_service.verify_session(raw_session_token)
            if session:
                self.token_service.revoke_session(session)
                self.security_audit.log_event("LOGOUT", "SUCCESS", user_id=session.user_id)
            db.session.commit()

    def logout_all(self, user_id):
        self.token_service.revoke_all_user_sessions(user_id)
        user = self.user_repo.get_by_id(user_id)
        if user:
            user.session_version += 1
        db.session.commit()

        self.security_audit.log_event("LOGOUT_ALL", "SUCCESS", user_id=user_id)
        db.session.commit()

    def get_sessions(self, user_id):
        return self.token_service.get_active_sessions(user_id)

    def revoke_session(self, session_id, user_id):
        result = self.token_service.revoke_session_by_id(session_id, user_id)
        if not result:
            raise NotFoundError("Session not found")
        db.session.commit()

        self.security_audit.log_event("SESSION_REVOKED", "SUCCESS", user_id=user_id,
                                       after_values={"session_id": session_id})
        db.session.commit()

    def verify_email(self, token):
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        verification = EmailVerificationToken.query.filter_by(token_hash=token_hash).first()

        if not verification or verification.is_used or verification.is_expired:
            raise AuthenticationError("Invalid or expired verification token")

        user = self.user_repo.get_by_id(verification.user_id)
        if not user:
            raise AuthenticationError("Invalid or expired verification token")

        user.email_verified = True
        verification.verified_at = datetime.now(timezone.utc)
        db.session.commit()

        self.security_audit.log_event("EMAIL_VERIFIED", "SUCCESS", user_id=user.id)
        db.session.commit()

    def resend_verification(self, email):
        user = self.user_repo.get_by_email(email)
        if not user or user.email_verified:
            return None  # Don't disclose account existence

        raw_token = self._create_verification_token(user.id)
        db.session.commit()
        return raw_token

    def get_me(self, user):
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "roles": user.role_names,
            "status": "ACTIVE" if user.is_active else "INACTIVE",
            "email_verified": user.email_verified,
        }

    def _create_verification_token(self, user_id):
        raw_token = secrets.token_hex(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

        token = EmailVerificationToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
        )
        db.session.add(token)
        db.session.flush()
        return raw_token

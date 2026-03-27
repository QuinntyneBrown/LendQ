import hashlib
import logging
import secrets
from datetime import datetime, timedelta, timezone

from app.errors.exceptions import AuthenticationError, ConflictError, ValidationError
from app.extensions import db
from app.models.user import User
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository
from app.services.password_service import PasswordService
from app.services.token_service import TokenService

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self):
        self.user_repo = UserRepository()
        self.role_repo = RoleRepository()
        self.password_service = PasswordService()
        self.token_service = TokenService()

    def login(self, email, password):
        user = self.user_repo.get_by_email(email)
        if not user or not user.is_active:
            raise AuthenticationError("Invalid credentials")

        if not self.password_service.verify_password(password, user.password_hash):
            raise AuthenticationError("Invalid credentials")

        token_pair = self.token_service.generate_token_pair(user)
        db.session.commit()
        logger.info("User logged in: %s", user.id)
        return token_pair

    def signup(self, name, email, password, confirm_password):
        if password != confirm_password:
            raise ValidationError("Passwords do not match")

        existing = self.user_repo.get_by_email(email)
        if existing:
            raise ConflictError("A user with this email already exists")

        password_hash = self.password_service.hash_password(password)
        user = User(name=name, email=email, password_hash=password_hash)

        borrower_role = self.role_repo.get_by_name("Borrower")
        if borrower_role:
            user.roles.append(borrower_role)

        self.user_repo.create(user)
        db.session.commit()
        logger.info("User signed up: %s", user.id)
        return user

    def forgot_password(self, email):
        user = self.user_repo.get_by_email(email)
        if not user:
            return  # Always return success to prevent enumeration

        raw_token = secrets.token_hex(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        user.reset_token_hash = token_hash
        user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        db.session.commit()

        logger.info("Password reset requested for user: %s", user.id)
        return raw_token

    def reset_password(self, token, password, confirm_password):
        if password != confirm_password:
            raise ValidationError("Passwords do not match")

        token_hash = hashlib.sha256(token.encode()).hexdigest()
        user = self.user_repo.get_by_reset_token_hash(token_hash)

        if not user:
            raise AuthenticationError("Invalid or expired reset token")

        if user.reset_token_expires < datetime.now(timezone.utc):
            raise AuthenticationError("Invalid or expired reset token")

        user.password_hash = self.password_service.hash_password(password)
        user.reset_token_hash = None
        user.reset_token_expires = None

        self.token_service.revoke_all_user_tokens(user.id)
        db.session.commit()

        logger.info("Password reset completed for user: %s", user.id)

    def refresh(self, refresh_token_raw):
        refresh_token = self.token_service.verify_refresh_token(refresh_token_raw)
        if not refresh_token:
            raise AuthenticationError("Invalid or expired refresh token")

        user = self.user_repo.get_by_id(refresh_token.user_id)
        if not user or not user.is_active:
            raise AuthenticationError("Invalid credentials")

        # Rotate: revoke old, issue new
        self.token_service.revoke_refresh_token(refresh_token_raw)
        token_pair = self.token_service.generate_token_pair(user)
        db.session.commit()
        return token_pair

    def logout(self, refresh_token_raw):
        if refresh_token_raw:
            self.token_service.revoke_refresh_token(refresh_token_raw)
            db.session.commit()

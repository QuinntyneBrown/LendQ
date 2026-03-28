import hashlib
import hmac
import logging
import uuid
from datetime import datetime, timezone

import jwt
from flask import current_app

from app.extensions import db
from app.models.auth_session import AuthSession

logger = logging.getLogger(__name__)


class TokenService:
    def generate_access_token(self, user, session_id):
        now = datetime.now(timezone.utc)
        expires = now + current_app.config["JWT_ACCESS_TOKEN_EXPIRES"]
        payload = {
            "sub": user.id,
            "email": user.email,
            "name": user.name,
            "roles": user.role_names,
            "session_id": session_id,
            "session_version": user.session_version,
            "iat": now,
            "exp": expires,
        }
        token = jwt.encode(
            payload,
            current_app.config["JWT_SECRET_KEY"],
            algorithm=current_app.config["JWT_ALGORITHM"],
        )
        return token, int(current_app.config["JWT_ACCESS_TOKEN_EXPIRES"].total_seconds())

    def create_session(self, user, user_agent=None, ip_address=None):
        raw_session_token = str(uuid.uuid4())
        session_hash = hashlib.sha256(raw_session_token.encode()).hexdigest()

        session = AuthSession(
            user_id=user.id,
            session_hash=session_hash,
            user_agent=user_agent,
            ip_address=ip_address,
        )
        db.session.add(session)
        db.session.flush()

        return raw_session_token, session

    def verify_session(self, raw_session_token):
        session_hash = hashlib.sha256(raw_session_token.encode()).hexdigest()
        session = AuthSession.query.filter_by(
            session_hash=session_hash
        ).first()

        if not session or session.is_revoked:
            return None

        return session

    def revoke_session(self, session):
        session.revoked_at = datetime.now(timezone.utc)
        db.session.flush()

    def revoke_session_by_id(self, session_id, user_id):
        session = AuthSession.query.filter_by(id=session_id, user_id=user_id).first()
        if session and not session.is_revoked:
            session.revoked_at = datetime.now(timezone.utc)
            db.session.flush()
            return True
        return False

    def revoke_all_user_sessions(self, user_id):
        now = datetime.now(timezone.utc)
        AuthSession.query.filter(
            AuthSession.user_id == user_id,
            AuthSession.revoked_at.is_(None),
        ).update({"revoked_at": now})
        db.session.flush()

    def get_active_sessions(self, user_id):
        return AuthSession.query.filter(
            AuthSession.user_id == user_id,
            AuthSession.revoked_at.is_(None),
        ).order_by(AuthSession.last_seen_at.desc()).all()

    def update_last_seen(self, session):
        session.last_seen_at = datetime.now(timezone.utc)
        db.session.flush()

    def generate_csrf_token(self, session_id):
        secret = current_app.config["JWT_SECRET_KEY"]
        return hmac.HMAC(
            secret.encode(), session_id.encode(), hashlib.sha256
        ).hexdigest()

    def verify_csrf_token(self, token, session_id):
        expected = self.generate_csrf_token(session_id)
        return hmac.compare_digest(token, expected)

    def generate_token_bundle(self, user, session_id):
        access_token, expires_in = self.generate_access_token(user, session_id)
        csrf_token = self.generate_csrf_token(session_id)
        return {
            "access_token": access_token,
            "expires_in_seconds": expires_in,
            "csrf_token": csrf_token,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "roles": user.role_names,
                "email_verified": user.email_verified,
            },
        }

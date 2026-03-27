import hashlib
import logging
import uuid
from datetime import datetime, timezone

import jwt
from flask import current_app

from app.extensions import db
from app.models.refresh_token import RefreshToken
from app.repositories.user_repository import UserRepository

logger = logging.getLogger(__name__)


class TokenService:
    def __init__(self):
        self.user_repo = UserRepository()

    def generate_access_token(self, user):
        now = datetime.now(timezone.utc)
        expires = now + current_app.config["JWT_ACCESS_TOKEN_EXPIRES"]
        payload = {
            "sub": user.id,
            "email": user.email,
            "name": user.name,
            "roles": user.role_names,
            "iat": now,
            "exp": expires,
        }
        token = jwt.encode(
            payload,
            current_app.config["JWT_SECRET_KEY"],
            algorithm=current_app.config["JWT_ALGORITHM"],
        )
        return token, int(current_app.config["JWT_ACCESS_TOKEN_EXPIRES"].total_seconds())

    def generate_refresh_token(self, user):
        raw_token = str(uuid.uuid4())
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        expires_at = datetime.now(timezone.utc) + current_app.config["JWT_REFRESH_TOKEN_EXPIRES"]

        refresh_token = RefreshToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        db.session.add(refresh_token)
        db.session.flush()

        return raw_token

    def verify_refresh_token(self, raw_token):
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        refresh_token = RefreshToken.query.filter_by(token_hash=token_hash).first()

        if not refresh_token:
            return None
        if refresh_token.is_revoked or refresh_token.is_expired:
            return None

        return refresh_token

    def revoke_refresh_token(self, raw_token):
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        refresh_token = RefreshToken.query.filter_by(token_hash=token_hash).first()
        if refresh_token:
            refresh_token.revoked_at = datetime.now(timezone.utc)
            db.session.flush()

    def revoke_all_user_tokens(self, user_id):
        now = datetime.now(timezone.utc)
        RefreshToken.query.filter(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked_at.is_(None),
        ).update({"revoked_at": now})
        db.session.flush()

    def generate_token_pair(self, user):
        access_token, expires_in = self.generate_access_token(user)
        refresh_token = self.generate_refresh_token(user)
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "Bearer",
            "expires_in": expires_in,
        }

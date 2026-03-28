from __future__ import annotations

import hashlib
import hmac
import logging
import uuid
from datetime import UTC, datetime

import jwt
from flask import current_app

from app.extensions import db
from app.models.auth_session import AuthSession
from app.models.user import User

logger = logging.getLogger(__name__)


class TokenService:
    def generate_access_token(self, user: User, session_id: str) -> tuple[str, int]:
        """Generate a signed JWT access token for the user.

        Args:
            user: The authenticated user.
            session_id: The associated session ID to embed in the token.

        Returns:
            A tuple of (encoded JWT string, expiry duration in seconds).
        """
        now = datetime.now(UTC)
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

    def create_session(
        self, user: User, user_agent: str | None = None, ip_address: str | None = None
    ) -> tuple[str, AuthSession]:
        """Create a new authentication session for the user.

        Args:
            user: The user to create a session for.
            user_agent: Browser/client user-agent string.
            ip_address: Client IP address.

        Returns:
            A tuple of (raw session token string, AuthSession instance).
        """
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

    def verify_session(self, raw_session_token: str) -> AuthSession | None:
        """Verify a raw session token and return the active session.

        Args:
            raw_session_token: The raw session token to verify.

        Returns:
            The AuthSession if valid, or None if invalid or revoked.
        """
        session_hash = hashlib.sha256(raw_session_token.encode()).hexdigest()
        session = AuthSession.query.filter_by(session_hash=session_hash).first()

        if not session or session.is_revoked:
            return None

        return session

    def revoke_session(self, session: AuthSession) -> None:
        """Revoke a session by setting its revoked_at timestamp.

        Args:
            session: The AuthSession to revoke.
        """
        session.revoked_at = datetime.now(UTC)
        db.session.flush()

    def revoke_session_by_id(self, session_id: str, user_id: str) -> bool:
        """Revoke a specific session by its ID and owning user.

        Args:
            session_id: The session ID to revoke.
            user_id: The owning user's ID.

        Returns:
            True if the session was found and revoked, False otherwise.
        """
        session = AuthSession.query.filter_by(id=session_id, user_id=user_id).first()
        if session and not session.is_revoked:
            session.revoked_at = datetime.now(UTC)
            db.session.flush()
            return True
        return False

    def revoke_all_user_sessions(self, user_id: str) -> None:
        """Revoke all active sessions for a user.

        Args:
            user_id: The user whose sessions to revoke.
        """
        now = datetime.now(UTC)
        AuthSession.query.filter(
            AuthSession.user_id == user_id,
            AuthSession.revoked_at.is_(None),
        ).update({"revoked_at": now})
        db.session.flush()

    def get_active_sessions(self, user_id: str) -> list[AuthSession]:
        """Fetch all active (non-revoked) sessions for a user.

        Args:
            user_id: The user whose sessions to retrieve.

        Returns:
            A list of active AuthSession instances, ordered by last_seen_at descending.
        """
        return (
            AuthSession.query.filter(
                AuthSession.user_id == user_id,
                AuthSession.revoked_at.is_(None),
            )
            .order_by(AuthSession.last_seen_at.desc())
            .all()
        )

    def update_last_seen(self, session: AuthSession) -> None:
        """Update the last-seen timestamp on a session.

        Args:
            session: The AuthSession to update.
        """
        session.last_seen_at = datetime.now(UTC)
        db.session.flush()

    def generate_csrf_token(self, session_id: str) -> str:
        """Generate an HMAC-based CSRF token for a session.

        Args:
            session_id: The session ID to generate the token for.

        Returns:
            The hex-encoded CSRF token.
        """
        secret = current_app.config["JWT_SECRET_KEY"]
        return hmac.HMAC(secret.encode(), session_id.encode(), hashlib.sha256).hexdigest()

    def verify_csrf_token(self, token: str, session_id: str) -> bool:
        """Verify a CSRF token against the expected value for a session.

        Args:
            token: The CSRF token to verify.
            session_id: The session ID the token should match.

        Returns:
            True if the token is valid, False otherwise.
        """
        expected = self.generate_csrf_token(session_id)
        return hmac.compare_digest(token, expected)

    def generate_token_bundle(self, user: User, session_id: str) -> dict:
        """Generate a complete authentication token bundle.

        Args:
            user: The authenticated user.
            session_id: The associated session ID.

        Returns:
            A dict containing access_token, expires_in_seconds, csrf_token, and user info.
        """
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

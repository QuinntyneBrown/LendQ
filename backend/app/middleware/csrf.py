import functools

from flask import g, request

from app.errors.exceptions import AuthenticationError
from app.services.token_service import TokenService


def require_csrf(f):
    """Decorator that validates X-CSRF-Token header for cookie-authenticated endpoints."""

    @functools.wraps(f)
    def decorated(*args, **kwargs):
        csrf_token = request.headers.get("X-CSRF-Token")
        if not csrf_token:
            raise AuthenticationError("Missing CSRF token")

        session_id = getattr(g, "session_id", None)
        if not session_id:
            raise AuthenticationError("No session context for CSRF validation")

        token_service = TokenService()
        if not token_service.verify_csrf_token(csrf_token, session_id):
            raise AuthenticationError("Invalid CSRF token")

        return f(*args, **kwargs)

    return decorated

import functools
import logging

import jwt
from flask import current_app, g, request

from app.errors.exceptions import AuthenticationError, AuthorizationError

logger = logging.getLogger(__name__)


def get_current_user():
    return getattr(g, "current_user", None)


def decode_token(token):
    try:
        payload = jwt.decode(
            token,
            current_app.config["JWT_SECRET_KEY"],
            algorithms=[current_app.config["JWT_ALGORITHM"]],
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthenticationError("Token has expired")
    except jwt.InvalidTokenError:
        raise AuthenticationError("Invalid token")


def require_auth(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise AuthenticationError("Missing or invalid authorization header")

        token = auth_header.split(" ", 1)[1]
        payload = decode_token(token)

        from app.repositories.user_repository import UserRepository

        user_repo = UserRepository()
        user = user_repo.get_by_id(payload.get("sub"))
        if not user or not user.is_active:
            raise AuthenticationError("Invalid credentials")

        g.current_user = user
        g.token_payload = payload
        return f(*args, **kwargs)

    return decorated


def require_role(*roles):
    def decorator(f):
        @functools.wraps(f)
        @require_auth
        def decorated(*args, **kwargs):
            user = g.current_user
            if not user.has_any_role(*roles):
                raise AuthorizationError()
            return f(*args, **kwargs)

        return decorated

    return decorator

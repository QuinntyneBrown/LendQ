import functools
import hashlib
import json
import logging

from flask import g, request

logger = logging.getLogger(__name__)

_idempotency_store = {}


def require_idempotency(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        idempotency_key = request.headers.get("Idempotency-Key")
        if not idempotency_key:
            return f(*args, **kwargs)

        user_id = getattr(g, "current_user", None)
        user_id = user_id.id if user_id else "anonymous"
        cache_key = f"{user_id}:{idempotency_key}"

        if cache_key in _idempotency_store:
            logger.info("Idempotent replay for key=%s", idempotency_key)
            cached = _idempotency_store[cache_key]
            return cached["body"], cached["status_code"], cached["headers"]

        response = f(*args, **kwargs)

        if isinstance(response, tuple):
            body, status_code = response[0], response[1]
            headers = response[2] if len(response) > 2 else {}
        else:
            body = response.get_data(as_text=True)
            status_code = response.status_code
            headers = dict(response.headers)

        if 200 <= status_code < 300:
            _idempotency_store[cache_key] = {
                "body": body,
                "status_code": status_code,
                "headers": headers,
            }

        return response

    return decorated

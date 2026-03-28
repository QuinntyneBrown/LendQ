import functools
import logging
from datetime import UTC, datetime, timedelta

from flask import g, jsonify, request

from app.errors.exceptions import ValidationError
from app.extensions import db
from app.models.idempotency_record import IdempotencyRecord

logger = logging.getLogger(__name__)

IDEMPOTENCY_TTL_HOURS = 24


def require_idempotency(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        key = request.headers.get("Idempotency-Key")
        if not key:
            raise ValidationError(
                "Idempotency-Key header is required",
                details={"Idempotency-Key": ["This header is required for this endpoint"]},
            )

        if len(key) < 8 or len(key) > 128:
            raise ValidationError("Idempotency-Key must be between 8 and 128 characters")

        # Check for existing record
        existing = IdempotencyRecord.query.filter_by(idempotency_key=key).first()
        if existing and not existing.is_expired:
            logger.info("Idempotency replay for key: %s", key)
            return jsonify(existing.response_body), existing.response_status or 200

        # Execute the actual handler
        response = f(*args, **kwargs)

        # Store the result
        resp_data = response[0].get_json() if isinstance(response, tuple) else response.get_json()
        resp_status = response[1] if isinstance(response, tuple) else 200

        user = getattr(g, "current_user", None)
        record = IdempotencyRecord(
            idempotency_key=key,
            user_id=user.id if user else None,
            response_body=resp_data,
            response_status=resp_status,
            expires_at=datetime.now(UTC) + timedelta(hours=IDEMPOTENCY_TTL_HOURS),
        )
        db.session.add(record)
        db.session.commit()

        return response

    return decorated

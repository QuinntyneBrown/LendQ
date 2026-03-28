import logging
from http import HTTPStatus

from flask import Blueprint, jsonify

from app.extensions import limiter

health_bp = Blueprint("health", __name__, url_prefix="/api/v1")

logger = logging.getLogger(__name__)


@health_bp.route("/health/live", methods=["GET"])
@limiter.exempt
def liveness():
    return jsonify({"status": "ok"}), HTTPStatus.OK


@health_bp.route("/health/ready", methods=["GET"])
@limiter.exempt
def readiness():
    checks = {}

    # Database check
    try:
        from app.extensions import db

        db.session.execute(db.text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as e:
        logger.error("Database health check failed: %s", e)
        checks["database"] = "unavailable"

    # Redis check
    try:
        import os

        import redis

        redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
        if redis_url and redis_url != "memory://":
            r = redis.from_url(redis_url, socket_timeout=2)
            r.ping()
            checks["redis"] = "ok"
        else:
            checks["redis"] = "skipped"
    except Exception as e:
        logger.error("Redis health check failed: %s", e)
        checks["redis"] = "unavailable"

    all_ok = all(v in ("ok", "skipped") for v in checks.values())
    status_code = HTTPStatus.OK if all_ok else HTTPStatus.SERVICE_UNAVAILABLE

    return jsonify({"status": "ready" if all_ok else "degraded", "checks": checks}), status_code

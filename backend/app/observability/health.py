import logging

from flask import Blueprint, jsonify

health_bp = Blueprint("health", __name__)

logger = logging.getLogger(__name__)


@health_bp.route("/health/live", methods=["GET"])
def liveness():
    return jsonify({"status": "ok"}), 200


@health_bp.route("/health/ready", methods=["GET"])
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
        import redis
        import os
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
    status_code = 200 if all_ok else 503

    return jsonify({"status": "ready" if all_ok else "degraded", "checks": checks}), status_code

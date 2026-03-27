from flask import Blueprint, jsonify

from app.extensions import db

health_bp = Blueprint("health", __name__)


@health_bp.route("/health/live", methods=["GET"])
def liveness():
    return jsonify({"status": "ok"}), 200


@health_bp.route("/health/ready", methods=["GET"])
def readiness():
    try:
        db.session.execute(db.text("SELECT 1"))
        db_status = "ok"
    except Exception:
        db_status = "error"

    status = "ok" if db_status == "ok" else "degraded"
    status_code = 200 if status == "ok" else 503

    return jsonify({
        "status": status,
        "checks": {"database": db_status},
    }), status_code

from flask import Blueprint, jsonify, request

from app.middleware.auth_middleware import require_role
from app.models.security_audit_event import SecurityAuditEvent

admin_bp = Blueprint("admin", __name__, url_prefix="/api/v1/admin")


@admin_bp.route("/audit-events", methods=["GET"])
@require_role("Admin")
def list_audit_events():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    user_id = request.args.get("user_id")
    action = request.args.get("action")

    query = SecurityAuditEvent.query

    if user_id:
        query = query.filter(SecurityAuditEvent.user_id == user_id)
    if action:
        query = query.filter(SecurityAuditEvent.action == action)

    query = query.order_by(SecurityAuditEvent.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    items = []
    for event in pagination.items:
        items.append({
            "id": event.id,
            "user_id": event.user_id,
            "action": event.action,
            "outcome": event.outcome,
            "request_id": event.request_id,
            "ip_address": event.ip_address,
            "created_at": event.created_at.isoformat() if event.created_at else None,
            "before_values": event.before_values,
            "after_values": event.after_values,
        })

    return jsonify({
        "items": items,
        "total": pagination.total,
        "page": page,
        "per_page": per_page,
    }), 200

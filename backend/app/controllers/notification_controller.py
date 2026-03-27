from flask import Blueprint, g, jsonify, request

from app.middleware.auth_middleware import require_auth
from app.schemas.notification_schemas import NotificationSchema
from app.schemas.pagination import paginated_response
from app.services.notification_service import NotificationService

notification_bp = Blueprint("notifications", __name__, url_prefix="/api/v1/notifications")

notification_schema = NotificationSchema()


@notification_bp.route("", methods=["GET"])
@require_auth
def list_notifications():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    notification_type = request.args.get("type")

    notification_service = NotificationService()
    result = notification_service.list_notifications(
        user_id=g.current_user.id,
        page=page,
        per_page=per_page,
        notification_type=notification_type,
    )
    return jsonify(paginated_response(notification_schema, result)), 200


@notification_bp.route("/count", methods=["GET"])
@require_auth
def get_unread_count():
    notification_service = NotificationService()
    count = notification_service.get_unread_count(g.current_user.id)
    return jsonify({"unread_count": count}), 200


@notification_bp.route("/<notification_id>/read", methods=["PUT"])
@require_auth
def mark_read(notification_id):
    notification_service = NotificationService()
    notification_service.mark_read(notification_id, g.current_user.id)
    return "", 204


@notification_bp.route("/read-all", methods=["PUT"])
@require_auth
def mark_all_read():
    notification_service = NotificationService()
    notification_service.mark_all_read(g.current_user.id)
    return "", 204

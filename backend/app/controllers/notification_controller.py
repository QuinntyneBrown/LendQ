import json
import time
from http import HTTPStatus

from flask import Blueprint, Response, g, jsonify, request

from app.extensions import db
from app.middleware.auth_middleware import require_auth
from app.models.notification_preference import NotificationPreference
from app.schemas.notification_schemas import NotificationSchema
from app.schemas.pagination import paginated_response
from app.services.notification_service import NotificationService

notification_schema = NotificationSchema()

notification_bp = Blueprint("notifications", __name__, url_prefix="/api/v1/notifications")


@notification_bp.route("/", methods=["GET"])
@require_auth
def list_notifications():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    notification_type = request.args.get("type")
    service = NotificationService()
    result = service.list_notifications(g.current_user.id, page, per_page, notification_type)
    return jsonify(paginated_response(notification_schema, result)), HTTPStatus.OK


@notification_bp.route("/unread-count", methods=["GET"])
@require_auth
def get_unread_count():
    service = NotificationService()
    count = service.get_unread_count(g.current_user.id)
    return jsonify({"count": count}), HTTPStatus.OK


@notification_bp.route("/<notification_id>/read", methods=["POST"])
@require_auth
def mark_read(notification_id):
    service = NotificationService()
    service.mark_read(notification_id, g.current_user.id)
    return "", HTTPStatus.NO_CONTENT


@notification_bp.route("/read-all", methods=["POST"])
@require_auth
def mark_all_read():
    service = NotificationService()
    service.mark_all_read(g.current_user.id)
    return "", HTTPStatus.NO_CONTENT


@notification_bp.route("/stream", methods=["GET"])
@require_auth
def notification_stream():
    user_id = g.current_user.id

    def event_stream():
        last_id = 0
        while True:
            from app.models.notification import Notification

            notifications = (
                Notification.query.filter(
                    Notification.user_id == user_id,
                    Notification.is_read == False,
                )
                .order_by(Notification.created_at.desc())
                .limit(10)
                .all()
            )

            for n in notifications:
                data = {
                    "id": n.id,
                    "type": n.type,
                    "title": n.title,
                    "body": n.body,
                    "is_read": n.is_read,
                    "created_at": n.created_at.isoformat() if n.created_at else None,
                }
                yield f"data: {json.dumps(data)}\n\n"

            yield ": heartbeat\n\n"
            time.sleep(15)

    return Response(
        event_stream(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# Notification Preferences endpoints
pref_bp = Blueprint(
    "notification_preferences", __name__, url_prefix="/api/v1/notification-preferences"
)


@pref_bp.route("/", methods=["GET"])
@require_auth
def get_preferences():
    pref = NotificationPreference.query.get(g.current_user.id)
    if not pref:
        # Return defaults
        return jsonify(
            {
                "payment_due_email": True,
                "payment_overdue_email": True,
                "payment_received_email": True,
                "schedule_changed_email": True,
                "loan_modified_email": True,
                "system_email": True,
            }
        ), HTTPStatus.OK

    return jsonify(
        {
            "payment_due_email": pref.payment_due_email,
            "payment_overdue_email": pref.payment_overdue_email,
            "payment_received_email": pref.payment_received_email,
            "schedule_changed_email": pref.schedule_changed_email,
            "loan_modified_email": pref.loan_modified_email,
            "system_email": pref.system_email,
        }
    ), HTTPStatus.OK


@pref_bp.route("/", methods=["PUT"])
@require_auth
def update_preferences():
    data = request.get_json()
    pref = NotificationPreference.query.get(g.current_user.id)

    if not pref:
        pref = NotificationPreference(user_id=g.current_user.id)
        db.session.add(pref)

    allowed_fields = [
        "payment_due_email",
        "payment_overdue_email",
        "payment_received_email",
        "schedule_changed_email",
        "loan_modified_email",
        "system_email",
    ]
    for field in allowed_fields:
        if field in data:
            setattr(pref, field, bool(data[field]))

    db.session.commit()

    return jsonify(
        {
            "payment_due_email": pref.payment_due_email,
            "payment_overdue_email": pref.payment_overdue_email,
            "payment_received_email": pref.payment_received_email,
            "schedule_changed_email": pref.schedule_changed_email,
            "loan_modified_email": pref.loan_modified_email,
            "system_email": pref.system_email,
        }
    ), HTTPStatus.OK

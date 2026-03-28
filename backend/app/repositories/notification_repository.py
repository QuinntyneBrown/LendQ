from app.models.notification import Notification
from app.repositories.base import BaseRepository


class NotificationRepository(BaseRepository):
    model = Notification

    def get_by_user(self, user_id, page=1, per_page=20, notification_type=None):
        query = Notification.query.filter_by(user_id=user_id)
        if notification_type:
            query = query.filter_by(type=notification_type)
        query = query.order_by(Notification.created_at.desc())
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        return {
            "items": pagination.items,
            "total": pagination.total,
            "page": pagination.page,
            "per_page": pagination.per_page,
            "pages": pagination.pages,
        }

    def get_unread_count(self, user_id):
        return Notification.query.filter_by(user_id=user_id, is_read=False).count()

    def mark_all_read(self, user_id):
        Notification.query.filter_by(user_id=user_id, is_read=False).update(
            {"is_read": True}
        )

    def check_duplicate(self, user_id, notification_type, loan_id):
        from datetime import datetime, timedelta, timezone

        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
        return Notification.query.filter(
            Notification.user_id == user_id,
            Notification.type == notification_type,
            Notification.loan_id == loan_id,
            Notification.created_at >= cutoff,
        ).first()

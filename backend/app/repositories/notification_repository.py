from __future__ import annotations

from datetime import UTC

from app.models.notification import Notification
from app.repositories.base import BaseRepository


class NotificationRepository(BaseRepository):
    model = Notification

    def get_by_user(
        self,
        user_id: str,
        page: int = 1,
        per_page: int = 20,
        notification_type: str | None = None,
    ) -> dict:
        """Return paginated notifications for a user.

        Args:
            user_id: The recipient user ID.
            page: The page number (1-indexed).
            per_page: Number of items per page.
            notification_type: Optional notification type filter.

        Returns:
            A paginated dict of notifications.
        """
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

    def get_unread_count(self, user_id: str) -> int:
        """Return the number of unread notifications for a user."""
        return Notification.query.filter_by(user_id=user_id, is_read=False).count()

    def mark_all_read(self, user_id: str) -> None:
        """Mark all unread notifications as read for a user."""
        Notification.query.filter_by(user_id=user_id, is_read=False).update({"is_read": True})

    def check_duplicate(
        self, user_id: str, notification_type: str, loan_id: str
    ) -> Notification | None:
        """Check for a duplicate notification sent within the last 24 hours.

        Args:
            user_id: The recipient user ID.
            notification_type: The notification type to check.
            loan_id: The associated loan ID.

        Returns:
            The existing Notification if a recent duplicate exists, else None.
        """
        from datetime import datetime, timedelta

        cutoff = datetime.now(UTC) - timedelta(hours=24)
        return Notification.query.filter(
            Notification.user_id == user_id,
            Notification.type == notification_type,
            Notification.loan_id == loan_id,
            Notification.created_at >= cutoff,
        ).first()

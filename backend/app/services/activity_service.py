from __future__ import annotations

from app.extensions import db
from app.models.activity import ActivityItem


class ActivityService:
    def log_activity(
        self, user_id: str, event_type: str, description: str, loan_id: str | None = None
    ) -> ActivityItem:
        """Record a user activity event.

        Args:
            user_id: The ID of the user who performed the action.
            event_type: The type of event (e.g. LOAN_CREATED, PAYMENT_RECORDED).
            description: Human-readable description of the activity.
            loan_id: Optional associated loan ID.

        Returns:
            The created ActivityItem instance.
        """
        item = ActivityItem(
            user_id=user_id,
            event_type=event_type,
            description=description,
            loan_id=loan_id,
        )
        db.session.add(item)
        db.session.flush()
        return item

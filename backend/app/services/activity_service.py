from app.extensions import db
from app.models.activity import ActivityItem


class ActivityService:
    def log_activity(self, user_id, event_type, description, loan_id=None):
        item = ActivityItem(
            user_id=user_id,
            event_type=event_type,
            description=description,
            loan_id=loan_id,
        )
        db.session.add(item)
        db.session.flush()
        return item

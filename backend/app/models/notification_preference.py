from datetime import UTC, datetime

from app.extensions import db


class NotificationPreference(db.Model):
    __tablename__ = "notification_preferences"

    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), primary_key=True)
    payment_due_email = db.Column(db.Boolean, default=True, nullable=False)
    payment_overdue_email = db.Column(db.Boolean, default=True, nullable=False)
    payment_received_email = db.Column(db.Boolean, default=True, nullable=False)
    schedule_changed_email = db.Column(db.Boolean, default=True, nullable=False)
    loan_modified_email = db.Column(db.Boolean, default=True, nullable=False)
    system_email = db.Column(db.Boolean, default=True, nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    user = db.relationship("User", foreign_keys=[user_id])

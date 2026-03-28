from datetime import UTC, datetime

from app.extensions import db
from app.models.base import UUIDMixin


class DeliveryChannel:
    IN_APP = "IN_APP"
    EMAIL = "EMAIL"


class DeliveryStatus:
    PENDING = "PENDING"
    SENT = "SENT"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"


class NotificationDelivery(UUIDMixin, db.Model):
    __tablename__ = "notification_deliveries"

    notification_id = db.Column(
        db.String(36), db.ForeignKey("notifications.id"), nullable=False, index=True
    )
    channel = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), nullable=False, default=DeliveryStatus.PENDING)
    attempt_count = db.Column(db.Integer, nullable=False, default=0)
    last_attempt_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(UTC))

    notification = db.relationship("Notification", foreign_keys=[notification_id])

import uuid
from datetime import datetime, timezone

from app.extensions import db


class DeliveryChannel:
    IN_APP = "IN_APP"
    EMAIL = "EMAIL"


class DeliveryStatus:
    PENDING = "PENDING"
    SENT = "SENT"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"


class NotificationDelivery(db.Model):
    __tablename__ = "notification_deliveries"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    notification_id = db.Column(
        db.String(36), db.ForeignKey("notifications.id"), nullable=False, index=True
    )
    channel = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), nullable=False, default=DeliveryStatus.PENDING)
    attempt_count = db.Column(db.Integer, nullable=False, default=0)
    last_attempt_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    notification = db.relationship("Notification", foreign_keys=[notification_id])

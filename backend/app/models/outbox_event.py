from datetime import UTC, datetime

from app.extensions import db
from app.models.base import UUIDMixin


class OutboxEvent(UUIDMixin, db.Model):
    __tablename__ = "outbox_events"

    aggregate_type = db.Column(db.String(50), nullable=False)
    aggregate_id = db.Column(db.String(36), nullable=False)
    event_type = db.Column(db.String(50), nullable=False)
    payload = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(UTC))
    published_at = db.Column(db.DateTime, nullable=True)

import uuid
from datetime import datetime, timezone

from app.extensions import db


class OutboxEvent(db.Model):
    __tablename__ = "outbox_events"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    aggregate_type = db.Column(db.String(50), nullable=False)
    aggregate_id = db.Column(db.String(36), nullable=False)
    event_type = db.Column(db.String(50), nullable=False)
    payload = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    published_at = db.Column(db.DateTime, nullable=True)

import uuid
from datetime import UTC, datetime

from app.extensions import db


class UUIDMixin:
    """Mixin that provides a UUID string primary key."""

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))


class TimestampMixin:
    """Mixin that provides created_at and updated_at timestamp columns."""

    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(UTC))
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

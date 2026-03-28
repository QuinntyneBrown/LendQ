from datetime import UTC, datetime

from app.extensions import db
from app.models.base import UUIDMixin


class IdempotencyRecord(UUIDMixin, db.Model):
    __tablename__ = "idempotency_records"

    idempotency_key = db.Column(db.String(255), nullable=False, unique=True, index=True)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    loan_id = db.Column(db.String(36), db.ForeignKey("loans.id"), nullable=True)
    request_hash = db.Column(db.String(255))
    response_body = db.Column(db.JSON)
    response_status = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(UTC))
    expires_at = db.Column(db.DateTime, nullable=False)

    @property
    def is_expired(self):
        return datetime.now(UTC) > self.expires_at.replace(tzinfo=UTC)

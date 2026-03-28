import uuid
from datetime import datetime, timezone

from app.extensions import db


class IdempotencyRecord(db.Model):
    __tablename__ = "idempotency_records"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    idempotency_key = db.Column(db.String(255), nullable=False, unique=True, index=True)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    loan_id = db.Column(db.String(36), db.ForeignKey("loans.id"), nullable=True)
    request_hash = db.Column(db.String(255))
    response_body = db.Column(db.JSON)
    response_status = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    expires_at = db.Column(db.DateTime, nullable=False)

    @property
    def is_expired(self):
        return datetime.now(timezone.utc) > self.expires_at.replace(tzinfo=timezone.utc)

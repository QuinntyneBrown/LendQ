from datetime import UTC, datetime

from app.extensions import db
from app.models.base import UUIDMixin


class EmailVerificationToken(UUIDMixin, db.Model):
    __tablename__ = "email_verification_tokens"

    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    token_hash = db.Column(db.String(255), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(UTC))
    expires_at = db.Column(db.DateTime, nullable=False)
    verified_at = db.Column(db.DateTime)

    user = db.relationship("User", foreign_keys=[user_id])

    @property
    def is_expired(self):
        return datetime.now(UTC) > self.expires_at.replace(tzinfo=UTC)

    @property
    def is_used(self):
        return self.verified_at is not None

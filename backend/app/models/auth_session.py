from datetime import UTC, datetime

from app.extensions import db
from app.models.base import UUIDMixin


class AuthSession(UUIDMixin, db.Model):
    __tablename__ = "auth_sessions"

    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    session_hash = db.Column(db.String(255), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(UTC))
    last_seen_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(UTC))
    user_agent = db.Column(db.String(500))
    ip_address = db.Column(db.String(45))
    revoked_at = db.Column(db.DateTime)

    user = db.relationship("User", foreign_keys=[user_id])

    @property
    def is_revoked(self):
        return self.revoked_at is not None

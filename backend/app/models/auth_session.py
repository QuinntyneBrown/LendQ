import uuid
from datetime import datetime, timezone

from app.extensions import db


class AuthSession(db.Model):
    __tablename__ = "auth_sessions"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    session_hash = db.Column(db.String(255), nullable=False, unique=True)
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    last_seen_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    user_agent = db.Column(db.String(500))
    ip_address = db.Column(db.String(45))
    revoked_at = db.Column(db.DateTime)

    user = db.relationship("User", foreign_keys=[user_id])

    @property
    def is_revoked(self):
        return self.revoked_at is not None

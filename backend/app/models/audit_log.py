from datetime import UTC, datetime

from app.extensions import db
from app.models.base import UUIDMixin


class AuditLog(UUIDMixin, db.Model):
    __tablename__ = "audit_logs"

    actor_id = db.Column(db.String(36), db.ForeignKey("users.id"), index=True)
    action = db.Column(db.String(50), nullable=False)
    target_type = db.Column(db.String(50), nullable=False)
    target_id = db.Column(db.String(36), nullable=False)
    before_value = db.Column(db.JSON)
    after_value = db.Column(db.JSON)
    timestamp = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(UTC))
    request_id = db.Column(db.String(36))

    actor = db.relationship("User", foreign_keys=[actor_id])

from datetime import UTC, datetime

from app.extensions import db
from app.models.base import UUIDMixin


class SecurityAuditEvent(UUIDMixin, db.Model):
    __tablename__ = "security_audit_events"

    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True, index=True)
    action = db.Column(db.String(50), nullable=False)
    outcome = db.Column(db.String(20), nullable=False)
    request_id = db.Column(db.String(36))
    ip_address = db.Column(db.String(45))
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(UTC))
    before_values = db.Column(db.JSON)
    after_values = db.Column(db.JSON)

    user = db.relationship("User", foreign_keys=[user_id])

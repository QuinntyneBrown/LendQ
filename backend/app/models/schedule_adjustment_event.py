import uuid
from datetime import datetime, timezone

from app.extensions import db


class AdjustmentType:
    RESCHEDULE = "RESCHEDULE"
    PAUSE = "PAUSE"


class AdjustmentStatus:
    APPLIED = "APPLIED"
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class ScheduleAdjustmentEvent(db.Model):
    __tablename__ = "schedule_adjustment_events"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    loan_id = db.Column(db.String(36), db.ForeignKey("loans.id"), nullable=False, index=True)
    type = db.Column(db.String(30), nullable=False)
    actor_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    reason = db.Column(db.Text)
    from_version_id = db.Column(db.String(36), db.ForeignKey("schedule_versions.id"))
    to_version_id = db.Column(db.String(36), db.ForeignKey("schedule_versions.id"))
    status = db.Column(db.String(20), nullable=False, default=AdjustmentStatus.APPLIED)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    resolved_at = db.Column(db.DateTime)

    loan = db.relationship("Loan", foreign_keys=[loan_id])
    actor = db.relationship("User", foreign_keys=[actor_id])

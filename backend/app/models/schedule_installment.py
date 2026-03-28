from datetime import UTC, datetime

from app.extensions import db
from app.models.base import UUIDMixin


class InstallmentStatus:
    SCHEDULED = "SCHEDULED"
    PARTIAL = "PARTIAL"
    PAID = "PAID"
    PAUSED = "PAUSED"
    RESCHEDULED = "RESCHEDULED"
    OVERDUE = "OVERDUE"


class ScheduleInstallment(UUIDMixin, db.Model):
    __tablename__ = "schedule_installments"

    schedule_version_id = db.Column(
        db.String(36), db.ForeignKey("schedule_versions.id"), nullable=False, index=True
    )
    sequence = db.Column(db.Integer, nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    amount_due = db.Column(db.Numeric(12, 2), nullable=False)
    status = db.Column(db.String(20), nullable=False, default=InstallmentStatus.SCHEDULED)
    original_due_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(UTC))

    schedule_version = db.relationship("ScheduleVersion", back_populates="installments")

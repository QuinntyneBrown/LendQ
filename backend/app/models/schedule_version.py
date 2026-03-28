import uuid
from datetime import datetime, timezone

from app.extensions import db


class ScheduleVersion(db.Model):
    __tablename__ = "schedule_versions"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    loan_id = db.Column(db.String(36), db.ForeignKey("loans.id"), nullable=False, index=True)
    version = db.Column(db.Integer, nullable=False, default=1)
    effective_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    created_by_event_id = db.Column(db.String(36), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    loan = db.relationship("Loan", foreign_keys=[loan_id])
    installments = db.relationship("ScheduleInstallment", back_populates="schedule_version", cascade="all, delete-orphan")

import uuid
from datetime import UTC, datetime

from app.extensions import db
from app.models.base import UUIDMixin


class GeneratedLoanRecord(UUIDMixin, db.Model):
    __tablename__ = "generated_loan_records"

    recurring_loan_id = db.Column(
        db.String(36), db.ForeignKey("recurring_loans.id"), nullable=False, index=True
    )
    loan_id = db.Column(
        db.String(36), db.ForeignKey("loans.id"), nullable=False, index=True
    )
    template_version_id = db.Column(
        db.String(36),
        db.ForeignKey("recurring_loan_template_versions.id"),
        nullable=False,
    )
    scheduled_for_date = db.Column(db.Date, nullable=False)
    sequence = db.Column(db.Integer, nullable=False)
    generated_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(UTC)
    )

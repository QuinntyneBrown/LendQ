import uuid
from datetime import UTC, datetime

from app.extensions import db
from app.models.base import UUIDMixin


class RecurringLoanTemplateVersion(UUIDMixin, db.Model):
    __tablename__ = "recurring_loan_template_versions"

    recurring_loan_id = db.Column(
        db.String(36), db.ForeignKey("recurring_loans.id"), nullable=False, index=True
    )
    version_number = db.Column(db.Integer, nullable=False)
    description_template = db.Column(db.String(500), nullable=False)
    principal_amount = db.Column(db.Numeric(14, 2), nullable=False)
    currency = db.Column(db.String(3), nullable=False, default="USD")
    interest_rate_percent = db.Column(db.Numeric(5, 2), nullable=True)
    repayment_frequency = db.Column(db.String(20), nullable=False)
    installment_count = db.Column(db.Integer, nullable=False)
    timezone = db.Column(db.String(50), nullable=False, default="UTC")
    allow_parallel_active_generated_loans = db.Column(
        db.Boolean, nullable=False, default=False
    )
    max_generated_loan_principal_exposure = db.Column(
        db.Numeric(14, 2), nullable=True
    )
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(UTC)
    )

    recurring_loan = db.relationship(
        "RecurringLoan",
        foreign_keys=[recurring_loan_id],
        overlaps="template_versions",
    )

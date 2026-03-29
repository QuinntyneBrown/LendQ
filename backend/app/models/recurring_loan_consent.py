import uuid
from datetime import UTC, datetime

from app.extensions import db
from app.models.base import UUIDMixin


class ConsentDecision:
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    REVOKED = "REVOKED"


class RecurringLoanConsent(UUIDMixin, db.Model):
    __tablename__ = "recurring_loan_consents"

    recurring_loan_id = db.Column(
        db.String(36), db.ForeignKey("recurring_loans.id"), nullable=False, index=True
    )
    template_version_id = db.Column(
        db.String(36),
        db.ForeignKey("recurring_loan_template_versions.id"),
        nullable=False,
    )
    decision = db.Column(db.String(20), nullable=False)
    decided_by_user_id = db.Column(
        db.String(36), db.ForeignKey("users.id"), nullable=False
    )
    decided_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(UTC)
    )
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(UTC)
    )

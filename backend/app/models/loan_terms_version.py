from datetime import UTC, datetime

from app.extensions import db
from app.models.base import UUIDMixin


class LoanTermsVersion(UUIDMixin, db.Model):
    __tablename__ = "loan_terms_versions"

    loan_id = db.Column(db.String(36), db.ForeignKey("loans.id"), nullable=False, index=True)
    version = db.Column(db.Integer, nullable=False, default=1)
    principal_amount = db.Column(db.Numeric(12, 2), nullable=False)
    currency = db.Column(db.String(3), nullable=False, default="USD")
    interest_rate_percent = db.Column(db.Numeric(5, 2), nullable=False, default=0)
    repayment_frequency = db.Column(db.String(20), nullable=False)
    installment_count = db.Column(db.Integer, nullable=True)
    maturity_date = db.Column(db.Date, nullable=True)
    start_date = db.Column(db.Date, nullable=False)
    creditor_notes = db.Column(db.Text, nullable=True)
    effective_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(UTC))
    created_by = db.Column(db.String(36), db.ForeignKey("users.id"))
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(UTC))

    loan = db.relationship("Loan", foreign_keys=[loan_id], overlaps="terms_versions")
    actor = db.relationship("User", foreign_keys=[created_by])

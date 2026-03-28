from datetime import UTC, datetime

from app.extensions import db
from app.models.base import UUIDMixin


class PaymentStatus:
    SCHEDULED = "SCHEDULED"
    PAID = "PAID"
    PARTIAL = "PARTIAL"
    RESCHEDULED = "RESCHEDULED"
    PAUSED = "PAUSED"
    OVERDUE = "OVERDUE"


class Payment(UUIDMixin, db.Model):
    __tablename__ = "payments"

    loan_id = db.Column(db.String(36), db.ForeignKey("loans.id"), nullable=False, index=True)
    amount_due = db.Column(db.Numeric(12, 2), nullable=False)
    amount_paid = db.Column(db.Numeric(12, 2), default=0.00)
    due_date = db.Column(db.Date, nullable=False, index=True)
    paid_date = db.Column(db.Date)
    original_due_date = db.Column(db.Date)
    status = db.Column(db.String(20), nullable=False, default=PaymentStatus.SCHEDULED, index=True)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(UTC))

    loan = db.relationship("Loan", back_populates="payments")

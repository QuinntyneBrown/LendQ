import uuid
from datetime import datetime, timezone

from app.extensions import db


class TransactionDirection:
    CREDIT = "CREDIT"
    DEBIT = "DEBIT"


class TransactionType:
    PAYMENT = "PAYMENT"
    REVERSAL = "REVERSAL"
    ADJUSTMENT = "ADJUSTMENT"


class PaymentTransaction(db.Model):
    __tablename__ = "payment_transactions"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    loan_id = db.Column(db.String(36), db.ForeignKey("loans.id"), nullable=False, index=True)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    direction = db.Column(db.String(10), nullable=False)
    transaction_type = db.Column(db.String(20), nullable=False)
    posted_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    payment_method = db.Column(db.String(50))
    notes = db.Column(db.Text)
    idempotency_key = db.Column(db.String(255), unique=True, nullable=True, index=True)
    created_by = db.Column(db.String(36), db.ForeignKey("users.id"))
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    loan = db.relationship("Loan", foreign_keys=[loan_id])
    actor = db.relationship("User", foreign_keys=[created_by])
    allocations = db.relationship("PaymentAllocation", back_populates="transaction", cascade="all, delete-orphan")

import uuid
from datetime import UTC, datetime
from app.extensions import db
from app.models.base import UUIDMixin


class BankTransactionDirection:
    CREDIT = "CREDIT"
    DEBIT = "DEBIT"


class BankTransactionEntryType:
    MANUAL_DEPOSIT = "MANUAL_DEPOSIT"
    MANUAL_WITHDRAWAL = "MANUAL_WITHDRAWAL"
    RECURRING_DEPOSIT = "RECURRING_DEPOSIT"
    REVERSAL = "REVERSAL"
    SAVINGS_CONTRIBUTION = "SAVINGS_CONTRIBUTION"
    SAVINGS_RELEASE = "SAVINGS_RELEASE"


class BankTransaction(UUIDMixin, db.Model):
    __tablename__ = "bank_transactions"

    account_id = db.Column(db.String(36), db.ForeignKey("bank_accounts.id"), nullable=False, index=True)
    direction = db.Column(db.String(10), nullable=False)
    entry_type = db.Column(db.String(30), nullable=False)
    amount = db.Column(db.Numeric(14, 2), nullable=False)
    balance_before = db.Column(db.Numeric(14, 2), nullable=False)
    balance_after = db.Column(db.Numeric(14, 2), nullable=False)
    reason_code = db.Column(db.String(50), nullable=True)
    initiated_by_user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    idempotency_key_hash = db.Column(db.String(255), nullable=True, index=True)
    reversed_transaction_id = db.Column(db.String(36), db.ForeignKey("bank_transactions.id"), nullable=True)
    correlation_id = db.Column(db.String(36), nullable=True)
    description = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(UTC))

    account = db.relationship("BankAccount", back_populates="transactions")
    initiated_by = db.relationship("User", foreign_keys=[initiated_by_user_id])

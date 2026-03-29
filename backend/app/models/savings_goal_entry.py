import uuid
from datetime import UTC, datetime
from app.extensions import db
from app.models.base import UUIDMixin


class SavingsGoalEntryDirection:
    CREDIT = "CREDIT"
    DEBIT = "DEBIT"


class SavingsGoalEntryType:
    CONTRIBUTION = "CONTRIBUTION"
    RELEASE = "RELEASE"
    ADJUSTMENT = "ADJUSTMENT"


class SavingsGoalEntry(UUIDMixin, db.Model):
    __tablename__ = "savings_goal_entries"

    goal_id = db.Column(db.String(36), db.ForeignKey("savings_goals.id"), nullable=False, index=True)
    direction = db.Column(db.String(10), nullable=False)
    entry_type = db.Column(db.String(20), nullable=False)
    amount = db.Column(db.Numeric(14, 2), nullable=False)
    bank_transaction_id = db.Column(db.String(36), db.ForeignKey("bank_transactions.id"), nullable=True)
    running_total = db.Column(db.Numeric(14, 2), nullable=False)
    idempotency_key_hash = db.Column(db.String(255), nullable=True, index=True)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(UTC))

    goal = db.relationship("SavingsGoal", back_populates="entries")

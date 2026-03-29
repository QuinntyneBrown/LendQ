import uuid
from datetime import UTC, datetime
from app.extensions import db
from app.models.base import UUIDMixin, TimestampMixin


class RecurringDepositStatus:
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    FAILED = "FAILED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class RecurringDeposit(UUIDMixin, TimestampMixin, db.Model):
    __tablename__ = "recurring_deposits"

    account_id = db.Column(db.String(36), db.ForeignKey("bank_accounts.id"), nullable=False, index=True)
    owner_user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    amount = db.Column(db.Numeric(14, 2), nullable=False)
    source_description = db.Column(db.String(255), nullable=False)
    frequency = db.Column(db.String(20), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=True)
    execution_time_local = db.Column(db.String(5), nullable=False, default="09:00")
    timezone = db.Column(db.String(50), nullable=False, default="UTC")
    status = db.Column(db.String(20), nullable=False, default=RecurringDepositStatus.ACTIVE)
    next_execution_at = db.Column(db.DateTime, nullable=True)
    last_failure_code = db.Column(db.String(100), nullable=True)
    version = db.Column(db.Integer, nullable=False, default=1)

    account = db.relationship("BankAccount", back_populates="recurring_deposits")
    owner = db.relationship("User", foreign_keys=[owner_user_id])

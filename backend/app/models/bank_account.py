import uuid
from datetime import UTC, datetime
from app.extensions import db
from app.models.base import UUIDMixin, TimestampMixin


class BankAccountStatus:
    ACTIVE = "ACTIVE"
    FROZEN = "FROZEN"
    CLOSED = "CLOSED"


class BankAccount(UUIDMixin, TimestampMixin, db.Model):
    __tablename__ = "bank_accounts"

    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    currency = db.Column(db.String(3), nullable=False, default="USD")
    current_balance = db.Column(db.Numeric(14, 2), nullable=False, default=0)
    status = db.Column(db.String(20), nullable=False, default=BankAccountStatus.ACTIVE)
    timezone = db.Column(db.String(50), nullable=False, default="UTC")
    version = db.Column(db.Integer, nullable=False, default=1)

    user = db.relationship("User", backref=db.backref("bank_accounts", lazy="dynamic"))
    transactions = db.relationship("BankTransaction", back_populates="account", lazy="dynamic")
    recurring_deposits = db.relationship("RecurringDeposit", back_populates="account", lazy="dynamic")

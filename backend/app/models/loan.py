import uuid
from datetime import datetime, timezone

from app.extensions import db


class LoanStatus:
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    OVERDUE = "OVERDUE"
    PAID_OFF = "PAID_OFF"
    DEFAULTED = "DEFAULTED"


class RepaymentFrequency:
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"
    CUSTOM = "custom"


class Loan(db.Model):
    __tablename__ = "loans"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    creditor_id = db.Column(
        db.String(36), db.ForeignKey("users.id"), nullable=False, index=True
    )
    borrower_id = db.Column(
        db.String(36), db.ForeignKey("users.id"), nullable=False, index=True
    )
    description = db.Column(db.String(500), nullable=False)
    principal = db.Column(db.Numeric(12, 2), nullable=False)
    interest_rate = db.Column(db.Numeric(5, 2), default=0.00)
    repayment_frequency = db.Column(db.String(20), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False, default=LoanStatus.ACTIVE, index=True)
    notes = db.Column(db.Text)
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    creditor = db.relationship("User", foreign_keys=[creditor_id], backref="loans_as_creditor")
    borrower = db.relationship("User", foreign_keys=[borrower_id], backref="loans_as_borrower")
    payments = db.relationship("Payment", back_populates="loan", cascade="all, delete-orphan")

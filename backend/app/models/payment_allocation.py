from datetime import UTC, datetime

from app.extensions import db
from app.models.base import UUIDMixin


class PaymentAllocation(UUIDMixin, db.Model):
    __tablename__ = "payment_allocations"

    transaction_id = db.Column(
        db.String(36), db.ForeignKey("payment_transactions.id"), nullable=False, index=True
    )
    installment_id = db.Column(
        db.String(36), db.ForeignKey("schedule_installments.id"), nullable=False
    )
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(UTC))

    transaction = db.relationship("PaymentTransaction", back_populates="allocations")
    installment = db.relationship("ScheduleInstallment", foreign_keys=[installment_id])

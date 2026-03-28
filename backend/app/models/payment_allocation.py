import uuid
from datetime import datetime, timezone

from app.extensions import db


class PaymentAllocation(db.Model):
    __tablename__ = "payment_allocations"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id = db.Column(
        db.String(36), db.ForeignKey("payment_transactions.id"), nullable=False, index=True
    )
    installment_id = db.Column(
        db.String(36), db.ForeignKey("schedule_installments.id"), nullable=False
    )
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    transaction = db.relationship("PaymentTransaction", back_populates="allocations")
    installment = db.relationship("ScheduleInstallment", foreign_keys=[installment_id])

from datetime import UTC, datetime

from app.extensions import db
from app.models.base import UUIDMixin


class NotificationType:
    PAYMENT_DUE = "PAYMENT_DUE"
    PAYMENT_OVERDUE = "PAYMENT_OVERDUE"
    PAYMENT_RECEIVED = "PAYMENT_RECEIVED"
    SCHEDULE_CHANGED = "SCHEDULE_CHANGED"
    LOAN_MODIFIED = "LOAN_MODIFIED"
    SYSTEM = "SYSTEM"


class Notification(UUIDMixin, db.Model):
    __tablename__ = "notifications"

    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    type = db.Column(db.String(30), nullable=False)
    title = db.Column(db.String(200), nullable=True)
    body = db.Column(db.Text, nullable=True)
    message = db.Column(db.String(500), nullable=True)  # Deprecated, use body
    loan_id = db.Column(db.String(36), db.ForeignKey("loans.id"), nullable=True)
    related_loan_id = db.Column(db.String(36), db.ForeignKey("loans.id"), nullable=True)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(UTC))

    user = db.relationship("User", back_populates="notifications")
    loan = db.relationship("Loan", foreign_keys=[loan_id])

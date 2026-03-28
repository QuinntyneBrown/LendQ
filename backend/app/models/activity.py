from datetime import UTC, datetime

from app.extensions import db
from app.models.base import UUIDMixin


class ActivityItem(UUIDMixin, db.Model):
    __tablename__ = "activity_items"

    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    event_type = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(500), nullable=False)
    loan_id = db.Column(db.String(36), db.ForeignKey("loans.id"), index=True)
    timestamp = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(UTC))

    user = db.relationship("User", foreign_keys=[user_id])
    loan = db.relationship("Loan")

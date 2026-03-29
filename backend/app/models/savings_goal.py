import uuid
from datetime import UTC, datetime
from app.extensions import db
from app.models.base import UUIDMixin, TimestampMixin


class SavingsGoalStatus:
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class SavingsGoal(UUIDMixin, TimestampMixin, db.Model):
    __tablename__ = "savings_goals"

    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    target_amount = db.Column(db.Numeric(14, 2), nullable=False)
    current_amount = db.Column(db.Numeric(14, 2), nullable=False, default=0)
    currency = db.Column(db.String(3), nullable=False, default="USD")
    deadline = db.Column(db.Date, nullable=True)
    description = db.Column(db.String(500), nullable=True)
    status = db.Column(db.String(20), nullable=False, default=SavingsGoalStatus.IN_PROGRESS)
    version = db.Column(db.Integer, nullable=False, default=1)

    user = db.relationship("User", backref=db.backref("savings_goals", lazy="dynamic"))
    entries = db.relationship("SavingsGoalEntry", back_populates="goal", lazy="dynamic")

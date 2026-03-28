import uuid
from datetime import datetime, timezone

from app.extensions import db


class ChangeRequestType:
    TERM_CHANGE = "TERM_CHANGE"
    RESCHEDULE = "RESCHEDULE"
    PAUSE = "PAUSE"


class ChangeRequestStatus:
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class LoanChangeRequest(db.Model):
    __tablename__ = "loan_change_requests"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    loan_id = db.Column(db.String(36), db.ForeignKey("loans.id"), nullable=False, index=True)
    requested_by = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    type = db.Column(db.String(30), nullable=False)
    status = db.Column(db.String(20), nullable=False, default=ChangeRequestStatus.PENDING)
    reason = db.Column(db.Text)
    proposed_changes = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    resolved_at = db.Column(db.DateTime)
    resolved_by = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)
    outcome_terms_version_id = db.Column(
        db.String(36), db.ForeignKey("loan_terms_versions.id"), nullable=True
    )

    loan = db.relationship("Loan", foreign_keys=[loan_id])
    requester = db.relationship("User", foreign_keys=[requested_by])
    resolver = db.relationship("User", foreign_keys=[resolved_by])

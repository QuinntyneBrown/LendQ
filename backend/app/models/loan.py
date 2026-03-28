from app.extensions import db
from app.models.base import TimestampMixin, UUIDMixin


class LoanStatus:
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    OVERDUE = "OVERDUE"
    PAID_OFF = "PAID_OFF"
    DEFAULTED = "DEFAULTED"


class RepaymentFrequency:
    WEEKLY = "WEEKLY"
    BIWEEKLY = "BIWEEKLY"
    MONTHLY = "MONTHLY"
    CUSTOM = "CUSTOM"


class Loan(UUIDMixin, TimestampMixin, db.Model):
    __tablename__ = "loans"

    creditor_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    borrower_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    description = db.Column(db.String(500), nullable=False)
    principal = db.Column(db.Numeric(12, 2), nullable=False)
    interest_rate = db.Column(db.Numeric(5, 2), default=0.00)
    repayment_frequency = db.Column(db.String(20), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False, default=LoanStatus.ACTIVE, index=True)
    notes = db.Column(db.Text)
    current_terms_version_id = db.Column(
        db.String(36), db.ForeignKey("loan_terms_versions.id"), nullable=True
    )
    current_schedule_version_id = db.Column(
        db.String(36), db.ForeignKey("schedule_versions.id"), nullable=True
    )
    creditor = db.relationship("User", foreign_keys=[creditor_id], backref="loans_as_creditor")
    borrower = db.relationship("User", foreign_keys=[borrower_id], backref="loans_as_borrower")
    payments = db.relationship("Payment", back_populates="loan", cascade="all, delete-orphan")
    current_terms_version = db.relationship(
        "LoanTermsVersion", foreign_keys=[current_terms_version_id], post_update=True
    )
    current_schedule_version = db.relationship(
        "ScheduleVersion", foreign_keys=[current_schedule_version_id], post_update=True
    )
    terms_versions = db.relationship(
        "LoanTermsVersion",
        foreign_keys="LoanTermsVersion.loan_id",
        order_by="LoanTermsVersion.version",
        overlaps="loan",
    )
    change_requests = db.relationship("LoanChangeRequest", foreign_keys="LoanChangeRequest.loan_id")

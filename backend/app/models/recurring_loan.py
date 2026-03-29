from app.extensions import db
from app.models.base import TimestampMixin, UUIDMixin


class RecurringLoanStatus:
    DRAFT = "DRAFT"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    SUSPENDED = "SUSPENDED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

    TERMINAL = {COMPLETED, CANCELLED}


class RecurringLoan(UUIDMixin, TimestampMixin, db.Model):
    __tablename__ = "recurring_loans"

    creditor_id = db.Column(
        db.String(36), db.ForeignKey("users.id"), nullable=False, index=True
    )
    borrower_id = db.Column(
        db.String(36), db.ForeignKey("users.id"), nullable=False, index=True
    )
    recurrence_interval = db.Column(db.String(20), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=True)
    max_occurrences = db.Column(db.Integer, nullable=True)
    status = db.Column(
        db.String(20), nullable=False, default=RecurringLoanStatus.DRAFT, index=True
    )
    active_template_version_id = db.Column(
        db.String(36),
        db.ForeignKey("recurring_loan_template_versions.id"),
        nullable=True,
    )
    total_generated = db.Column(db.Integer, nullable=False, default=0)
    next_generation_at = db.Column(db.DateTime, nullable=True)
    last_failure_code = db.Column(db.String(100), nullable=True)
    version = db.Column(db.Integer, nullable=False, default=1)

    creditor = db.relationship(
        "User", foreign_keys=[creditor_id], backref="recurring_loans_as_creditor"
    )
    borrower = db.relationship(
        "User", foreign_keys=[borrower_id], backref="recurring_loans_as_borrower"
    )
    active_template_version = db.relationship(
        "RecurringLoanTemplateVersion",
        foreign_keys=[active_template_version_id],
        post_update=True,
    )
    template_versions = db.relationship(
        "RecurringLoanTemplateVersion",
        foreign_keys="RecurringLoanTemplateVersion.recurring_loan_id",
        order_by="RecurringLoanTemplateVersion.version_number",
        overlaps="recurring_loan",
    )
    consents = db.relationship(
        "RecurringLoanConsent",
        foreign_keys="RecurringLoanConsent.recurring_loan_id",
        order_by="RecurringLoanConsent.created_at.desc()",
    )
    generated_records = db.relationship(
        "GeneratedLoanRecord",
        foreign_keys="GeneratedLoanRecord.recurring_loan_id",
        order_by="GeneratedLoanRecord.sequence",
    )

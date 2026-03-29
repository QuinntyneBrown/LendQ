from __future__ import annotations

import logging
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal

from dateutil.relativedelta import relativedelta

from app.errors.exceptions import (
    AuthorizationError,
    ConflictError,
    NotFoundError,
    ValidationError,
)
from app.extensions import db
from app.models.generated_loan_record import GeneratedLoanRecord
from app.models.recurring_loan import RecurringLoan, RecurringLoanStatus
from app.models.recurring_loan_consent import ConsentDecision, RecurringLoanConsent
from app.models.recurring_loan_template_version import RecurringLoanTemplateVersion
from app.models.user import User
from app.repositories.recurring_loan_repository import (
    ConsentRepository,
    GeneratedLoanRecordRepository,
    RecurringLoanRepository,
    TemplateVersionRepository,
)
from app.repositories.user_repository import UserRepository
from app.services.audit_service import AuditService
from app.services.loan_service import LoanService

logger = logging.getLogger(__name__)


class RecurringLoanService:
    def __init__(self) -> None:
        """Initialize RecurringLoanService with required repositories and services."""
        self.recurring_loan_repo = RecurringLoanRepository()
        self.template_version_repo = TemplateVersionRepository()
        self.consent_repo = ConsentRepository()
        self.generated_record_repo = GeneratedLoanRecordRepository()
        self.user_repo = UserRepository()
        self.loan_service = LoanService()
        self.audit_service = AuditService()

    # ── Helpers ──────────────────────────────────────────────────────────

    @staticmethod
    def _compute_next_execution(
        from_dt: datetime, interval: str
    ) -> datetime:
        """Compute the next execution datetime based on the recurrence interval."""
        if interval == "WEEKLY":
            return from_dt + timedelta(days=7)
        if interval == "BIWEEKLY":
            return from_dt + timedelta(days=14)
        if interval == "MONTHLY":
            return from_dt + relativedelta(months=1)
        raise ValidationError(f"Unsupported recurrence interval: {interval}")

    def _assert_creditor_owner(self, recurring: RecurringLoan, user: User) -> None:
        """Raise AuthorizationError unless the user is the creditor owner."""
        if recurring.creditor_id != user.id and not user.has_role("Admin"):
            raise AuthorizationError("Only the creditor owner can perform this action")

    def _assert_borrower_participant(self, recurring: RecurringLoan, user: User) -> None:
        """Raise AuthorizationError unless the user is the borrower participant."""
        if recurring.borrower_id != user.id and not user.has_role("Admin"):
            raise AuthorizationError("Only the borrower can perform this action")

    def _assert_participant_or_admin(self, recurring: RecurringLoan, user: User) -> None:
        """Raise AuthorizationError unless the user is creditor, borrower, or admin."""
        if (
            not user.has_role("Admin")
            and recurring.creditor_id != user.id
            and recurring.borrower_id != user.id
        ):
            raise AuthorizationError("You do not have access to this recurring loan")

    def _get_recurring_or_404(self, recurring_id: str) -> RecurringLoan:
        """Fetch a recurring loan by ID or raise NotFoundError."""
        recurring = self.recurring_loan_repo.get_by_id(recurring_id)
        if not recurring:
            raise NotFoundError("Recurring loan not found")
        return recurring

    # ── Queries ──────────────────────────────────────────────────────────

    def list_recurring_loans(
        self, user: User, page: int = 1, per_page: int = 20
    ) -> dict:
        """List recurring loans visible to the user."""
        if user.has_role("Admin"):
            return self.recurring_loan_repo.get_paginated(
                page=page,
                per_page=per_page,
                order_by=RecurringLoan.created_at.desc(),
            )
        return self.recurring_loan_repo.get_visible_to_user(
            user.id, page=page, per_page=per_page
        )

    def get_recurring_loan(self, recurring_id: str, user: User) -> RecurringLoan:
        """Fetch a recurring loan by ID with authorization check."""
        recurring = self._get_recurring_or_404(recurring_id)
        self._assert_participant_or_admin(recurring, user)
        return recurring

    def list_generated_loans(
        self, recurring_id: str, user: User, page: int = 1, per_page: int = 20
    ) -> dict:
        """List generated loan records for a recurring loan."""
        recurring = self._get_recurring_or_404(recurring_id)
        self._assert_participant_or_admin(recurring, user)
        return self.generated_record_repo.get_by_recurring_loan(
            recurring_id, page=page, per_page=per_page
        )

    # ── Mutations ────────────────────────────────────────────────────────

    def create_recurring_loan(self, data: dict, user: User) -> RecurringLoan:
        """Create a new recurring loan in DRAFT status with the first template version."""
        if not user.has_role("Creditor") and not user.has_role("Admin"):
            raise AuthorizationError("Only creditors can create recurring loans")

        borrower = self.user_repo.get_by_id(data["borrower_id"])
        if not borrower or not borrower.has_role("Borrower"):
            raise ValidationError("Invalid borrower")

        principal = Decimal(str(data["principal_amount"]))
        if principal <= 0:
            raise ValidationError("Principal amount must be greater than zero")

        recurring = RecurringLoan(
            creditor_id=user.id,
            borrower_id=data["borrower_id"],
            recurrence_interval=data["recurrence_interval"],
            start_date=data["start_date"],
            end_date=data.get("end_date"),
            max_occurrences=data.get("max_occurrences"),
            status=RecurringLoanStatus.DRAFT,
        )
        self.recurring_loan_repo.create(recurring)

        template = RecurringLoanTemplateVersion(
            recurring_loan_id=recurring.id,
            version_number=1,
            description_template=data["description_template"],
            principal_amount=principal,
            currency=data.get("currency", "USD"),
            interest_rate_percent=(
                Decimal(str(data["interest_rate_percent"]))
                if data.get("interest_rate_percent") is not None
                else None
            ),
            repayment_frequency=data["repayment_frequency"],
            installment_count=data["installment_count"],
            timezone=data.get("timezone", "UTC"),
            allow_parallel_active_generated_loans=data.get(
                "allow_parallel_active_generated_loans", False
            ),
            max_generated_loan_principal_exposure=(
                Decimal(str(data["max_generated_loan_principal_exposure"]))
                if data.get("max_generated_loan_principal_exposure") is not None
                else None
            ),
        )
        self.template_version_repo.create(template)

        recurring.active_template_version_id = template.id
        self.recurring_loan_repo.update(recurring)

        self.audit_service.log(
            "CREATE", "RecurringLoan", recurring.id, actor_id=user.id
        )
        db.session.commit()

        logger.info("Recurring loan created: %s by %s", recurring.id, user.id)
        return recurring

    def update_recurring_loan(
        self, recurring_id: str, data: dict, user: User
    ) -> RecurringLoan:
        """Update a recurring loan by creating a new template version."""
        recurring = self._get_recurring_or_404(recurring_id)
        self._assert_creditor_owner(recurring, user)

        allowed_statuses = {
            RecurringLoanStatus.DRAFT,
            RecurringLoanStatus.PAUSED,
            RecurringLoanStatus.SUSPENDED,
        }
        if recurring.status not in allowed_statuses:
            raise ValidationError(
                f"Cannot update recurring loan in {recurring.status} status"
            )

        expected_version = data.pop("expected_version")
        if recurring.version != expected_version:
            raise ConflictError(
                "Recurring loan has been modified by another request. "
                f"Expected version {expected_version}, current version {recurring.version}"
            )

        # Determine new template values, falling back to current template
        current = recurring.active_template_version
        new_version_number = (current.version_number if current else 0) + 1

        template = RecurringLoanTemplateVersion(
            recurring_loan_id=recurring.id,
            version_number=new_version_number,
            description_template=data.get(
                "description_template",
                current.description_template if current else "",
            ),
            principal_amount=Decimal(str(data["principal_amount"]))
            if "principal_amount" in data
            else current.principal_amount,
            currency=data.get("currency", current.currency if current else "USD"),
            interest_rate_percent=(
                Decimal(str(data["interest_rate_percent"]))
                if "interest_rate_percent" in data
                else (current.interest_rate_percent if current else None)
            ),
            repayment_frequency=data.get(
                "repayment_frequency",
                current.repayment_frequency if current else "MONTHLY",
            ),
            installment_count=data.get(
                "installment_count",
                current.installment_count if current else 1,
            ),
            timezone=data.get("timezone", current.timezone if current else "UTC"),
            allow_parallel_active_generated_loans=data.get(
                "allow_parallel_active_generated_loans",
                current.allow_parallel_active_generated_loans if current else False,
            ),
            max_generated_loan_principal_exposure=(
                Decimal(str(data["max_generated_loan_principal_exposure"]))
                if "max_generated_loan_principal_exposure" in data
                else (
                    current.max_generated_loan_principal_exposure if current else None
                )
            ),
        )
        self.template_version_repo.create(template)

        # Update top-level fields if provided
        if "recurrence_interval" in data:
            recurring.recurrence_interval = data["recurrence_interval"]
        if "start_date" in data:
            recurring.start_date = data["start_date"]
        if "end_date" in data:
            recurring.end_date = data["end_date"]
        if "max_occurrences" in data:
            recurring.max_occurrences = data["max_occurrences"]

        recurring.active_template_version_id = template.id
        recurring.version += 1
        self.recurring_loan_repo.update(recurring)

        self.audit_service.log(
            "UPDATE", "RecurringLoan", recurring.id, actor_id=user.id
        )
        db.session.commit()

        logger.info("Recurring loan updated: %s by %s", recurring.id, user.id)
        return recurring

    def submit_for_approval(self, recurring_id: str, user: User) -> RecurringLoan:
        """Submit a DRAFT recurring loan for borrower approval."""
        recurring = self._get_recurring_or_404(recurring_id)
        self._assert_creditor_owner(recurring, user)

        if recurring.status != RecurringLoanStatus.DRAFT:
            raise ValidationError("Only DRAFT recurring loans can be submitted for approval")

        recurring.status = RecurringLoanStatus.PENDING_APPROVAL
        self.recurring_loan_repo.update(recurring)

        self.audit_service.log(
            "SUBMIT_FOR_APPROVAL", "RecurringLoan", recurring.id, actor_id=user.id
        )

        # Emit notification to borrower
        try:
            from app.services.notification_service import NotificationService

            notification_service = NotificationService()
            notification_service.create_notification(
                user_id=recurring.borrower_id,
                notification_type="RECURRING_LOAN_APPROVAL_REQUEST",
                message=f"You have a new recurring loan to review from {recurring.creditor.name}.",
            )
        except Exception:
            logger.warning(
                "Failed to send approval notification for recurring loan %s",
                recurring.id,
                exc_info=True,
            )

        db.session.commit()
        logger.info(
            "Recurring loan %s submitted for approval by %s", recurring.id, user.id
        )
        return recurring

    def approve(self, recurring_id: str, user: User) -> RecurringLoan:
        """Approve a PENDING_APPROVAL recurring loan (borrower action)."""
        recurring = self._get_recurring_or_404(recurring_id)
        self._assert_borrower_participant(recurring, user)

        if recurring.status != RecurringLoanStatus.PENDING_APPROVAL:
            raise ValidationError("Only PENDING_APPROVAL recurring loans can be approved")

        consent = RecurringLoanConsent(
            recurring_loan_id=recurring.id,
            template_version_id=recurring.active_template_version_id,
            decision=ConsentDecision.APPROVED,
            decided_by_user_id=user.id,
        )
        self.consent_repo.create(consent)

        recurring.status = RecurringLoanStatus.ACTIVE
        now = datetime.now(UTC)
        start_dt = datetime.combine(recurring.start_date, datetime.min.time()).replace(
            tzinfo=UTC
        )
        if start_dt > now:
            recurring.next_generation_at = start_dt
        else:
            recurring.next_generation_at = self._compute_next_execution(
                now, recurring.recurrence_interval
            )
        self.recurring_loan_repo.update(recurring)

        self.audit_service.log(
            "APPROVE", "RecurringLoan", recurring.id, actor_id=user.id
        )
        db.session.commit()

        logger.info("Recurring loan %s approved by %s", recurring.id, user.id)
        return recurring

    def reject(self, recurring_id: str, user: User) -> RecurringLoan:
        """Reject a PENDING_APPROVAL recurring loan (borrower action)."""
        recurring = self._get_recurring_or_404(recurring_id)
        self._assert_borrower_participant(recurring, user)

        if recurring.status != RecurringLoanStatus.PENDING_APPROVAL:
            raise ValidationError("Only PENDING_APPROVAL recurring loans can be rejected")

        consent = RecurringLoanConsent(
            recurring_loan_id=recurring.id,
            template_version_id=recurring.active_template_version_id,
            decision=ConsentDecision.REJECTED,
            decided_by_user_id=user.id,
        )
        self.consent_repo.create(consent)

        recurring.status = RecurringLoanStatus.DRAFT
        self.recurring_loan_repo.update(recurring)

        self.audit_service.log(
            "REJECT", "RecurringLoan", recurring.id, actor_id=user.id
        )
        db.session.commit()

        logger.info("Recurring loan %s rejected by %s", recurring.id, user.id)
        return recurring

    def pause(self, recurring_id: str, user: User) -> RecurringLoan:
        """Pause an ACTIVE recurring loan (creditor action)."""
        recurring = self._get_recurring_or_404(recurring_id)
        self._assert_creditor_owner(recurring, user)

        if recurring.status != RecurringLoanStatus.ACTIVE:
            raise ValidationError("Only ACTIVE recurring loans can be paused")

        recurring.status = RecurringLoanStatus.PAUSED
        recurring.next_generation_at = None
        self.recurring_loan_repo.update(recurring)

        self.audit_service.log(
            "PAUSE", "RecurringLoan", recurring.id, actor_id=user.id
        )
        db.session.commit()

        logger.info("Recurring loan %s paused by %s", recurring.id, user.id)
        return recurring

    def resume(self, recurring_id: str, user: User) -> RecurringLoan:
        """Resume a PAUSED recurring loan (creditor action)."""
        recurring = self._get_recurring_or_404(recurring_id)
        self._assert_creditor_owner(recurring, user)

        if recurring.status != RecurringLoanStatus.PAUSED:
            raise ValidationError("Only PAUSED recurring loans can be resumed")

        recurring.status = RecurringLoanStatus.ACTIVE
        now = datetime.now(UTC)
        recurring.next_generation_at = self._compute_next_execution(
            now, recurring.recurrence_interval
        )
        self.recurring_loan_repo.update(recurring)

        self.audit_service.log(
            "RESUME", "RecurringLoan", recurring.id, actor_id=user.id
        )
        db.session.commit()

        logger.info("Recurring loan %s resumed by %s", recurring.id, user.id)
        return recurring

    def cancel(self, recurring_id: str, user: User) -> RecurringLoan:
        """Cancel a recurring loan (creditor or borrower action)."""
        recurring = self._get_recurring_or_404(recurring_id)
        self._assert_participant_or_admin(recurring, user)

        if recurring.status in RecurringLoanStatus.TERMINAL:
            raise ValidationError("Recurring loan is already in a terminal state")

        recurring.status = RecurringLoanStatus.CANCELLED
        recurring.next_generation_at = None
        self.recurring_loan_repo.update(recurring)

        # If borrower is cancelling, create a REVOKED consent
        if recurring.borrower_id == user.id:
            consent = RecurringLoanConsent(
                recurring_loan_id=recurring.id,
                template_version_id=recurring.active_template_version_id,
                decision=ConsentDecision.REVOKED,
                decided_by_user_id=user.id,
            )
            self.consent_repo.create(consent)

        self.audit_service.log(
            "CANCEL", "RecurringLoan", recurring.id, actor_id=user.id
        )
        db.session.commit()

        logger.info("Recurring loan %s cancelled by %s", recurring.id, user.id)
        return recurring

    # ── Scheduled Generation ─────────────────────────────────────────────

    def process_due_recurring_loans(self) -> int:
        """Process all recurring loans that are due for generation.

        Returns:
            The number of loans successfully generated.
        """
        now = datetime.now(UTC)
        due_loans = self.recurring_loan_repo.get_due_for_generation(now)
        generated_count = 0

        for recurring in due_loans:
            try:
                self._generate_loan_for_recurring(recurring, now)
                generated_count += 1
            except Exception:
                logger.exception(
                    "Failed to generate loan for recurring %s", recurring.id
                )
                recurring.status = RecurringLoanStatus.SUSPENDED
                recurring.last_failure_code = "GENERATION_FAILED"
                recurring.next_generation_at = None
                self.recurring_loan_repo.update(recurring)
                self.audit_service.log(
                    "SUSPEND",
                    "RecurringLoan",
                    recurring.id,
                    after_value={"reason": "GENERATION_FAILED"},
                )
                db.session.commit()

        return generated_count

    def _generate_loan_for_recurring(
        self, recurring: RecurringLoan, now: datetime
    ) -> None:
        """Generate a single loan from a recurring loan template."""
        template = recurring.active_template_version
        if not template:
            raise ValidationError("No active template version")

        # Validate creditor and borrower are still active
        creditor = self.user_repo.get_by_id(recurring.creditor_id)
        borrower = self.user_repo.get_by_id(recurring.borrower_id)
        if not creditor or not creditor.is_active:
            raise ValidationError("Creditor is no longer active")
        if not borrower or not borrower.is_active:
            raise ValidationError("Borrower is no longer active")

        # Determine scheduled date
        scheduled_date = (
            recurring.next_generation_at.date()
            if recurring.next_generation_at
            else now.date()
        )

        # Dedup check
        existing = self.generated_record_repo.find_by_recurring_and_date(
            recurring.id, scheduled_date
        )
        if existing:
            logger.warning(
                "Duplicate generation skipped for recurring %s on %s",
                recurring.id,
                scheduled_date,
            )
            # Advance to next execution even on dedup
            recurring.next_generation_at = self._compute_next_execution(
                now, recurring.recurrence_interval
            )
            self.recurring_loan_repo.update(recurring)
            db.session.commit()
            return

        # Generate description from template
        sequence = recurring.total_generated + 1
        description = template.description_template.format(
            sequence=sequence,
            date=scheduled_date.isoformat(),
        )

        # Create the loan via LoanService
        loan_data = {
            "borrower_id": recurring.borrower_id,
            "description": description,
            "principal": str(template.principal_amount),
            "interest_rate": str(template.interest_rate_percent or "0.00"),
            "repayment_frequency": template.repayment_frequency,
            "num_payments": template.installment_count,
            "start_date": scheduled_date,
        }

        # Use a synthetic creditor user object
        loan = self.loan_service.create_loan(loan_data, creditor)

        # Record the generated loan
        record = GeneratedLoanRecord(
            recurring_loan_id=recurring.id,
            loan_id=loan.id,
            template_version_id=template.id,
            scheduled_for_date=scheduled_date,
            sequence=sequence,
        )
        self.generated_record_repo.create(record)

        # Update recurring loan counters
        recurring.total_generated = sequence
        recurring.last_failure_code = None

        # Check completion conditions
        completed = False
        if recurring.max_occurrences and sequence >= recurring.max_occurrences:
            completed = True
        if recurring.end_date and scheduled_date >= recurring.end_date:
            completed = True

        if completed:
            recurring.status = RecurringLoanStatus.COMPLETED
            recurring.next_generation_at = None
        else:
            recurring.next_generation_at = self._compute_next_execution(
                now, recurring.recurrence_interval
            )

        self.recurring_loan_repo.update(recurring)
        self.audit_service.log(
            "GENERATE_LOAN",
            "RecurringLoan",
            recurring.id,
            after_value={"loan_id": loan.id, "sequence": sequence},
        )
        db.session.commit()

        logger.info(
            "Generated loan %s (seq %d) for recurring %s",
            loan.id,
            sequence,
            recurring.id,
        )

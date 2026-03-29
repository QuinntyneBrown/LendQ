from __future__ import annotations

from datetime import datetime

from sqlalchemy import or_

from app.extensions import db
from app.models.generated_loan_record import GeneratedLoanRecord
from app.models.recurring_loan import RecurringLoan, RecurringLoanStatus
from app.models.recurring_loan_consent import RecurringLoanConsent
from app.models.recurring_loan_template_version import RecurringLoanTemplateVersion
from app.repositories.base import BaseRepository


class RecurringLoanRepository(BaseRepository):
    model = RecurringLoan

    def get_by_creditor(
        self,
        creditor_id: str,
        page: int = 1,
        per_page: int = 20,
    ) -> dict:
        """Return paginated recurring loans where the given user is the creditor."""
        query = RecurringLoan.query.filter_by(creditor_id=creditor_id)
        query = query.order_by(RecurringLoan.created_at.desc())
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        return {
            "items": pagination.items,
            "total": pagination.total,
            "page": pagination.page,
            "per_page": pagination.per_page,
            "pages": pagination.pages,
        }

    def get_visible_to_user(
        self,
        user_id: str,
        page: int = 1,
        per_page: int = 20,
    ) -> dict:
        """Return paginated recurring loans where user is creditor or borrower."""
        query = RecurringLoan.query.filter(
            or_(
                RecurringLoan.creditor_id == user_id,
                RecurringLoan.borrower_id == user_id,
            )
        )
        query = query.order_by(RecurringLoan.created_at.desc())
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        return {
            "items": pagination.items,
            "total": pagination.total,
            "page": pagination.page,
            "per_page": pagination.per_page,
            "pages": pagination.pages,
        }

    def lock_for_update(self, recurring_id: str) -> RecurringLoan | None:
        """Fetch a recurring loan with a row-level lock for update."""
        return (
            RecurringLoan.query.filter_by(id=recurring_id)
            .with_for_update()
            .first()
        )

    def get_due_for_generation(self, now: datetime) -> list[RecurringLoan]:
        """Return active recurring loans due for generation, with FOR UPDATE SKIP LOCKED."""
        return (
            RecurringLoan.query.filter(
                RecurringLoan.status == RecurringLoanStatus.ACTIVE,
                RecurringLoan.next_generation_at <= now,
            )
            .with_for_update(skip_locked=True)
            .all()
        )


class TemplateVersionRepository(BaseRepository):
    model = RecurringLoanTemplateVersion


class ConsentRepository(BaseRepository):
    model = RecurringLoanConsent


class GeneratedLoanRecordRepository(BaseRepository):
    model = GeneratedLoanRecord

    def get_by_recurring_loan(
        self,
        recurring_loan_id: str,
        page: int = 1,
        per_page: int = 20,
    ) -> dict:
        """Return paginated generated loan records ordered by sequence."""
        query = GeneratedLoanRecord.query.filter_by(
            recurring_loan_id=recurring_loan_id
        )
        query = query.order_by(GeneratedLoanRecord.sequence.asc())
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        return {
            "items": pagination.items,
            "total": pagination.total,
            "page": pagination.page,
            "per_page": pagination.per_page,
            "pages": pagination.pages,
        }

    def find_by_recurring_and_date(
        self, recurring_loan_id: str, scheduled_for_date
    ) -> GeneratedLoanRecord | None:
        """Check for an existing record to prevent duplicate generation."""
        return GeneratedLoanRecord.query.filter_by(
            recurring_loan_id=recurring_loan_id,
            scheduled_for_date=scheduled_for_date,
        ).first()

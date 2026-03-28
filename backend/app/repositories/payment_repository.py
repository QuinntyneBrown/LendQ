from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy import and_

from app.models.payment import Payment, PaymentStatus
from app.repositories.base import BaseRepository


class PaymentRepository(BaseRepository):
    model = Payment

    def get_schedule(self, loan_id: str) -> list[Payment]:
        """Return all payments for a loan ordered by due date."""
        return Payment.query.filter_by(loan_id=loan_id).order_by(Payment.due_date.asc()).all()

    def get_next_due(self, loan_id: str) -> Payment | None:
        """Return the next unpaid payment for a loan.

        Args:
            loan_id: The loan to look up.

        Returns:
            The earliest scheduled/partial/rescheduled Payment, or None.
        """
        return (
            Payment.query.filter(
                Payment.loan_id == loan_id,
                Payment.status.in_(
                    [PaymentStatus.SCHEDULED, PaymentStatus.PARTIAL, PaymentStatus.RESCHEDULED]
                ),
            )
            .order_by(Payment.due_date.asc())
            .first()
        )

    def get_overdue_payments(self, as_of: date | None = None) -> list[Payment]:
        """Return all payments that are past due.

        Args:
            as_of: Reference date; defaults to today.

        Returns:
            List of overdue Payment instances.
        """
        if as_of is None:
            as_of = date.today()
        return Payment.query.filter(
            Payment.due_date < as_of,
            Payment.status.in_(
                [PaymentStatus.SCHEDULED, PaymentStatus.PARTIAL, PaymentStatus.RESCHEDULED]
            ),
        ).all()

    def get_due_soon(self, days: int = 3, as_of: date | None = None) -> list[Payment]:
        """Return scheduled payments due within the given number of days.

        Args:
            days: Look-ahead window in days.
            as_of: Reference date; defaults to today.

        Returns:
            List of Payment instances due soon.
        """
        if as_of is None:
            as_of = date.today()
        target = as_of + timedelta(days=days)
        return Payment.query.filter(
            and_(
                Payment.due_date >= as_of,
                Payment.due_date <= target,
                Payment.status == PaymentStatus.SCHEDULED,
            )
        ).all()

    def get_payments_for_loan_by_status(self, loan_id: str, statuses: list[str]) -> list[Payment]:
        """Return payments for a loan filtered by a set of statuses.

        Args:
            loan_id: The loan to query.
            statuses: Allowed payment status values.

        Returns:
            List of matching Payment instances ordered by due date.
        """
        return (
            Payment.query.filter(
                Payment.loan_id == loan_id,
                Payment.status.in_(statuses),
            )
            .order_by(Payment.due_date.asc())
            .all()
        )

    def get_upcoming_count(self, user_id: str, days: int = 7) -> int:
        """Count upcoming payments for loans involving a user.

        Args:
            user_id: The user ID (as creditor or borrower).
            days: Look-ahead window in days.

        Returns:
            Number of upcoming payments.
        """
        from app.models.loan import Loan

        as_of = date.today()
        target = as_of + timedelta(days=days)
        return (
            Payment.query.join(Loan)
            .filter(
                (Loan.creditor_id == user_id) | (Loan.borrower_id == user_id),
                Payment.due_date >= as_of,
                Payment.due_date <= target,
                Payment.status.in_([PaymentStatus.SCHEDULED, PaymentStatus.RESCHEDULED]),
            )
            .count()
        )

    def get_overdue_count(self, user_id: str) -> int:
        """Count overdue payments for loans involving a user.

        Args:
            user_id: The user ID (as creditor or borrower).

        Returns:
            Number of overdue payments.
        """
        from app.models.loan import Loan

        return (
            Payment.query.join(Loan)
            .filter(
                (Loan.creditor_id == user_id) | (Loan.borrower_id == user_id),
                Payment.status == PaymentStatus.OVERDUE,
            )
            .count()
        )

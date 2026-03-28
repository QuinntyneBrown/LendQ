from __future__ import annotations

import logging

from app.models.user import User
from app.repositories.activity_repository import ActivityRepository
from app.repositories.loan_repository import LoanRepository
from app.repositories.payment_repository import PaymentRepository
from app.services.balance_service import BalanceService

logger = logging.getLogger(__name__)


class DashboardService:
    def __init__(self) -> None:
        """Initialize DashboardService with required repositories and services."""
        self.loan_repo = LoanRepository()
        self.payment_repo = PaymentRepository()
        self.activity_repo = ActivityRepository()
        self.balance_service = BalanceService()

    def get_summary(self, user: User) -> dict:
        """Build a financial summary for the user's dashboard.

        Args:
            user: The authenticated user.

        Returns:
            A dict with total_lent_out, total_owed, upcoming_payments_7d, and overdue_payments.
        """
        return {
            "total_lent_out": self.balance_service.get_total_lent_out(user.id),
            "total_owed": self.balance_service.get_total_owed(user.id),
            "upcoming_payments_7d": self.payment_repo.get_upcoming_count(user.id, days=7),
            "overdue_payments": self.payment_repo.get_overdue_count(user.id),
        }

    def get_loans(self, user: User, tab: str = "creditor") -> list[dict]:
        """Fetch active loans for the dashboard with balance and next-due info.

        Args:
            user: The authenticated user.
            tab: View perspective ('creditor' or 'borrower').

        Returns:
            A list of loan summary dicts.
        """
        if tab == "creditor":
            loans = self.loan_repo.get_active_loans_as_creditor(user.id)
        else:
            loans = self.loan_repo.get_active_loans_as_borrower(user.id)

        result = []
        for loan in loans:
            next_payment = self.payment_repo.get_next_due(loan.id)
            counterparty = loan.borrower if tab == "creditor" else loan.creditor
            result.append(
                {
                    "id": loan.id,
                    "person_name": counterparty.name if counterparty else "Unknown",
                    "principal": loan.principal,
                    "amount": loan.principal,
                    "outstanding_balance": self.balance_service.get_outstanding_balance(loan.id),
                    "next_due": next_payment.due_date.isoformat() if next_payment else None,
                    "status": loan.status,
                }
            )
        return result

    def get_activity(self, user: User, limit: int = 20) -> list:
        """Fetch recent activity items for the user.

        Args:
            user: The authenticated user.
            limit: Maximum number of activity items to return.

        Returns:
            A list of recent ActivityItem instances.
        """
        return self.activity_repo.get_recent(user.id, limit=limit)

    def get_full_dashboard(self, user: User, tab: str = "creditor") -> dict:
        """Build the complete dashboard payload for a user.

        Args:
            user: The authenticated user.
            tab: View perspective ('creditor' or 'borrower').

        Returns:
            A dict containing summary, loans, and activity sections.
        """
        return {
            "summary": self.get_summary(user),
            "loans": self.get_loans(user, tab=tab),
            "activity": self.get_activity(user),
        }

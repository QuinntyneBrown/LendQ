import logging
from decimal import Decimal

from app.repositories.activity_repository import ActivityRepository
from app.repositories.loan_repository import LoanRepository
from app.repositories.payment_repository import PaymentRepository
from app.services.balance_service import BalanceService

logger = logging.getLogger(__name__)


class DashboardService:
    def __init__(self):
        self.loan_repo = LoanRepository()
        self.payment_repo = PaymentRepository()
        self.activity_repo = ActivityRepository()
        self.balance_service = BalanceService()

    def get_summary(self, user):
        return {
            "total_lent_out": self.balance_service.get_total_lent_out(user.id),
            "total_owed": self.balance_service.get_total_owed(user.id),
            "upcoming_payments_7d": self.payment_repo.get_upcoming_count(user.id, days=7),
            "overdue_payments": self.payment_repo.get_overdue_count(user.id),
        }

    def get_loans(self, user, tab="creditor"):
        if tab == "creditor":
            loans = self.loan_repo.get_active_loans_as_creditor(user.id)
        else:
            loans = self.loan_repo.get_active_loans_as_borrower(user.id)

        result = []
        for loan in loans:
            next_payment = self.payment_repo.get_next_due(loan.id)
            counterparty = loan.borrower if tab == "creditor" else loan.creditor
            result.append({
                "id": loan.id,
                "counterparty_name": counterparty.name if counterparty else "Unknown",
                "principal": loan.principal,
                "outstanding_balance": self.balance_service.get_outstanding_balance(loan.id),
                "next_due_date": next_payment.due_date if next_payment else None,
                "status": loan.status,
            })
        return result

    def get_activity(self, user, limit=20):
        return self.activity_repo.get_recent(user.id, limit=limit)

    def get_full_dashboard(self, user, tab="creditor"):
        return {
            "summary": self.get_summary(user),
            "loans": self.get_loans(user, tab=tab),
            "activity": self.get_activity(user),
        }

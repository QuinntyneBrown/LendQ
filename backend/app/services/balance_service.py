from decimal import Decimal

from app.models.payment import PaymentStatus
from app.repositories.payment_repository import PaymentRepository


class BalanceService:
    def __init__(self):
        self.payment_repo = PaymentRepository()

    def get_outstanding_balance(self, loan_id):
        payments = self.payment_repo.get_schedule(loan_id)
        total_due = sum(Decimal(str(p.amount_due)) for p in payments)
        total_paid = sum(Decimal(str(p.amount_paid or 0)) for p in payments)
        return total_due - total_paid

    def get_total_paid(self, loan_id):
        payments = self.payment_repo.get_schedule(loan_id)
        return sum(Decimal(str(p.amount_paid or 0)) for p in payments)

    def get_total_lent_out(self, user_id):
        from app.repositories.loan_repository import LoanRepository
        loan_repo = LoanRepository()
        loans = loan_repo.get_active_loans_as_creditor(user_id)
        return sum(Decimal(str(loan.principal)) for loan in loans)

    def get_total_owed(self, user_id):
        from app.repositories.loan_repository import LoanRepository
        loan_repo = LoanRepository()
        loans = loan_repo.get_active_loans_as_borrower(user_id)
        total = Decimal("0")
        for loan in loans:
            total += self.get_outstanding_balance(loan.id)
        return total

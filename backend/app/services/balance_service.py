from __future__ import annotations

from decimal import Decimal

from app.repositories.payment_repository import PaymentRepository


class BalanceService:
    def __init__(self) -> None:
        """Initialize BalanceService with the payment repository."""
        self.payment_repo = PaymentRepository()

    def get_outstanding_balance(self, loan_id: str) -> Decimal:
        """Calculate the outstanding balance for a loan.

        Args:
            loan_id: The loan's unique identifier.

        Returns:
            The remaining balance (total due minus total paid).
        """
        payments = self.payment_repo.get_schedule(loan_id)
        total_due = sum(Decimal(str(p.amount_due)) for p in payments)
        total_paid = sum(Decimal(str(p.amount_paid or 0)) for p in payments)
        return total_due - total_paid

    def get_total_paid(self, loan_id: str) -> Decimal:
        """Calculate the total amount paid for a loan.

        Args:
            loan_id: The loan's unique identifier.

        Returns:
            The sum of all payments made.
        """
        payments = self.payment_repo.get_schedule(loan_id)
        return sum(Decimal(str(p.amount_paid or 0)) for p in payments)

    def get_total_lent_out(self, user_id: str) -> Decimal:
        """Calculate the total principal lent out by a creditor.

        Args:
            user_id: The creditor's user ID.

        Returns:
            The sum of principal amounts across active loans as creditor.
        """
        from app.repositories.loan_repository import LoanRepository

        loan_repo = LoanRepository()
        loans = loan_repo.get_active_loans_as_creditor(user_id)
        return sum(Decimal(str(loan.principal)) for loan in loans)

    def get_total_owed(self, user_id: str) -> Decimal:
        """Calculate the total outstanding amount owed by a borrower.

        Args:
            user_id: The borrower's user ID.

        Returns:
            The sum of outstanding balances across active loans as borrower.
        """
        from app.repositories.loan_repository import LoanRepository

        loan_repo = LoanRepository()
        loans = loan_repo.get_active_loans_as_borrower(user_id)
        total = Decimal("0")
        for loan in loans:
            total += self.get_outstanding_balance(loan.id)
        return total

from __future__ import annotations

from datetime import timedelta
from decimal import Decimal

from dateutil.relativedelta import relativedelta

from app.models.loan import Loan
from app.models.payment import Payment, PaymentStatus


class ScheduleService:
    def generate_schedule(self, loan: Loan) -> list[Payment]:
        """Generate an amortized payment schedule for a loan.

        Computes equal installment amounts based on the loan's principal,
        interest rate, and repayment frequency. Adjusts the final payment
        to account for rounding differences on zero-interest loans.

        Args:
            loan: The Loan instance (must have _num_payments attribute set).

        Returns:
            A list of Payment instances representing the schedule.
        """
        principal = Decimal(str(loan.principal))
        rate = Decimal(str(loan.interest_rate)) / Decimal("100")
        frequency = loan.repayment_frequency
        start_date = loan.start_date
        num_payments = getattr(loan, "_num_payments", 12)

        if rate > 0:
            monthly_rate = rate / Decimal("12")
            payment_amount = principal * (
                monthly_rate / (1 - (1 + monthly_rate) ** (-num_payments))
            )
        else:
            payment_amount = principal / num_payments

        payment_amount = payment_amount.quantize(Decimal("0.01"))
        payments = []

        for i in range(num_payments):
            due_date = self._compute_due_date(start_date, frequency, i)
            payment = Payment(
                loan_id=loan.id,
                amount_due=payment_amount,
                due_date=due_date,
                status=PaymentStatus.SCHEDULED,
            )
            payments.append(payment)

        # Adjust last payment for rounding
        total_scheduled = payment_amount * num_payments
        if rate == 0 and total_scheduled != principal:
            diff = principal - (payment_amount * (num_payments - 1))
            payments[-1].amount_due = diff

        return payments

    def _compute_due_date(self, start_date, frequency, index):
        if frequency == "weekly":
            return start_date + timedelta(weeks=index + 1)
        elif frequency == "biweekly":
            return start_date + timedelta(weeks=2 * (index + 1))
        elif frequency == "monthly":
            return start_date + relativedelta(months=index + 1)
        else:
            return start_date + relativedelta(months=index + 1)

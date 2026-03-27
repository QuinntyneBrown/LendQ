from datetime import date
from decimal import Decimal
from unittest.mock import MagicMock

from app.services.schedule_service import ScheduleService


class TestScheduleService:
    def setup_method(self):
        self.service = ScheduleService()

    def test_zero_interest_schedule(self):
        loan = MagicMock()
        loan.id = "test-loan-id"
        loan.principal = Decimal("1200")
        loan.interest_rate = Decimal("0")
        loan.repayment_frequency = "monthly"
        loan.start_date = date(2024, 1, 1)
        loan._num_payments = 12

        payments = self.service.generate_schedule(loan)
        assert len(payments) == 12
        assert all(p.amount_due == Decimal("100.00") for p in payments)

    def test_with_interest_schedule(self):
        loan = MagicMock()
        loan.id = "test-loan-id"
        loan.principal = Decimal("10000")
        loan.interest_rate = Decimal("12")
        loan.repayment_frequency = "monthly"
        loan.start_date = date(2024, 1, 1)
        loan._num_payments = 12

        payments = self.service.generate_schedule(loan)
        assert len(payments) == 12
        assert all(p.amount_due > 0 for p in payments)

    def test_weekly_frequency(self):
        loan = MagicMock()
        loan.id = "test-loan-id"
        loan.principal = Decimal("400")
        loan.interest_rate = Decimal("0")
        loan.repayment_frequency = "weekly"
        loan.start_date = date(2024, 1, 1)
        loan._num_payments = 4

        payments = self.service.generate_schedule(loan)
        assert len(payments) == 4
        assert payments[0].due_date == date(2024, 1, 8)
        assert payments[1].due_date == date(2024, 1, 15)

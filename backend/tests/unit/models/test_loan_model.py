from app.models.loan import LoanStatus, RepaymentFrequency


class TestLoanModel:
    def test_loan_status_values(self):
        assert LoanStatus.ACTIVE == "ACTIVE"
        assert LoanStatus.PAUSED == "PAUSED"
        assert LoanStatus.OVERDUE == "OVERDUE"
        assert LoanStatus.PAID_OFF == "PAID_OFF"

    def test_repayment_frequency_values(self):
        assert RepaymentFrequency.WEEKLY == "weekly"
        assert RepaymentFrequency.BIWEEKLY == "biweekly"
        assert RepaymentFrequency.MONTHLY == "monthly"

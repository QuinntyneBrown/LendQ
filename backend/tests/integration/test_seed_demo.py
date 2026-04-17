"""Integration tests for the demo seed.

Regression test for docs/bugs/2026-04-17-staging-demo-seed-missing-loans.md.

The bug: on staging, the demo seed is supposed to create sample loans, but
creditor@lendq.local ends up with zero loans. This test pins the contract
the seed is supposed to fulfill so the bug cannot silently regress.
"""

from app.extensions import db
from app.models.loan import Loan, LoanStatus
from app.models.payment import Payment
from app.models.user import User
from app.seed import seed_demo


class TestSeedDemo:
    def test_seed_demo_creates_demo_users(self):
        seed_demo()

        emails = {u.email for u in User.query.all()}
        assert "creditor@lendq.local" in emails
        assert "borrower1@lendq.local" in emails
        assert "borrower2@lendq.local" in emails

    def test_seed_demo_creates_loans_for_creditor(self):
        """Regression — bug 2026-04-17-staging-demo-seed-missing-loans.

        On staging the creditor ends up with zero loans; this asserts that,
        in a clean environment, seed_demo() produces at least one loan where
        creditor@lendq.local is the creditor.
        """
        seed_demo()

        creditor = User.query.filter_by(email="creditor@lendq.local").first()
        assert creditor is not None, "demo creditor user must exist"

        loans = Loan.query.filter_by(creditor_id=creditor.id).all()
        assert len(loans) > 0, (
            "demo seed must create at least one loan for creditor@lendq.local "
            "— see docs/bugs/2026-04-17-staging-demo-seed-missing-loans.md"
        )

    def test_seed_demo_creates_loans_in_varied_statuses(self):
        seed_demo()

        statuses = {loan.status for loan in Loan.query.all()}
        # The user guide advertises demo loans in multiple states; require at
        # least ACTIVE so the dashboard has something to render.
        assert LoanStatus.ACTIVE in statuses

    def test_seed_demo_creates_payments(self):
        seed_demo()

        assert Payment.query.count() > 0, (
            "demo seed must create a payment schedule so the dashboard and "
            "loan detail pages have something to show"
        )

    def test_seed_demo_is_idempotent_for_loans(self):
        """Running seed_demo twice must not double-insert loans."""
        seed_demo()
        first_count = Loan.query.count()
        db.session.expire_all()

        seed_demo()
        second_count = Loan.query.count()

        assert first_count == second_count, (
            f"seed_demo is not idempotent: first run created {first_count} loans, "
            f"second run produced {second_count}"
        )

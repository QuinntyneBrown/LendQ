"""Integration tests for bank-account endpoints.

Seeded with the past-start-date regression from
docs/bugs/2026-04-17-recurring-deposit-past-start-date.md.
"""

import datetime
from decimal import Decimal

from app.extensions import db
from app.models.bank_account import BankAccount, BankAccountStatus


def _future_date(days: int = 30) -> str:
    return (datetime.date.today() + datetime.timedelta(days=days)).isoformat()


def _past_date(days: int = 30) -> str:
    return (datetime.date.today() - datetime.timedelta(days=days)).isoformat()


def _provision_account(user) -> BankAccount:
    acct = BankAccount(
        user_id=user.id,
        currency="CAD",
        current_balance=Decimal("1000.00"),
        status=BankAccountStatus.ACTIVE,
    )
    db.session.add(acct)
    db.session.commit()
    return acct


class TestRecurringDepositEndpoints:
    def test_create_recurring_deposit_accepts_future_start_date(
        self, client, borrower_user, auth_headers
    ):
        acct = _provision_account(borrower_user)

        resp = client.post(
            f"/api/v1/accounts/{acct.id}/recurring-deposits",
            json={
                "amount": 50,
                "source_description": "Payroll",
                "frequency": "MONTHLY",
                "start_date": _future_date(30),
            },
            headers=auth_headers(borrower_user),
        )
        assert resp.status_code == 201, resp.get_json()

    def test_create_recurring_deposit_rejects_past_start_date(
        self, client, borrower_user, auth_headers
    ):
        """Regression for 2026-04-17-recurring-deposit-past-start-date.

        Before this fix, start_date=2010 produced a deposit whose
        next_execution_at was the same 2010 instant — the scheduler would
        attempt catch-up deposits for every missed cycle.
        """
        acct = _provision_account(borrower_user)

        resp = client.post(
            f"/api/v1/accounts/{acct.id}/recurring-deposits",
            json={
                "amount": 50,
                "source_description": "Past-date audit",
                "frequency": "MONTHLY",
                "start_date": _past_date(30),
            },
            headers=auth_headers(borrower_user),
        )
        assert resp.status_code == 422, resp.get_json()
        data = resp.get_json()
        assert data["code"] == "VALIDATION_ERROR"
        assert "past" in data["message"].lower() or "start date" in data["message"].lower()

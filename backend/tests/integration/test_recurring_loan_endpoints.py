"""Integration tests for recurring-loan endpoints.

Seeded with the past-start-date regression from
docs/bugs/2026-04-17-recurring-loan-past-start-date.md. Expand as further
recurring-loan flows get coverage.
"""

import datetime


def _future_date(days: int = 30) -> str:
    return (datetime.date.today() + datetime.timedelta(days=days)).isoformat()


def _past_date(days: int = 30) -> str:
    return (datetime.date.today() - datetime.timedelta(days=days)).isoformat()


def _valid_payload(borrower_id: str, start_date: str) -> dict:
    return {
        "borrower_id": borrower_id,
        "description_template": "Recurring loan audit",
        "principal_amount": 100,
        "currency": "CAD",
        "interest_rate_percent": 0,
        "repayment_frequency": "MONTHLY",
        "installment_count": 3,
        "recurrence_interval": "MONTHLY",
        "start_date": start_date,
    }


class TestRecurringLoanEndpoints:
    def test_create_recurring_loan_accepts_future_start_date(
        self, client, creditor_user, borrower_user, auth_headers
    ):
        resp = client.post(
            "/api/v1/loans/recurring",
            json=_valid_payload(borrower_user.id, _future_date(30)),
            headers=auth_headers(creditor_user),
        )
        assert resp.status_code == 201, resp.get_json()

    def test_create_recurring_loan_rejects_past_start_date(
        self, client, creditor_user, borrower_user, auth_headers
    ):
        """Regression for 2026-04-17-recurring-loan-past-start-date.

        Back-dating a recurring template anchors next_generation_at in the
        past and risks kicking off catch-up generation for dozens of
        missed cycles.
        """
        resp = client.post(
            "/api/v1/loans/recurring",
            json=_valid_payload(borrower_user.id, _past_date(30)),
            headers=auth_headers(creditor_user),
        )
        assert resp.status_code == 422, resp.get_json()
        data = resp.get_json()
        assert data["code"] == "VALIDATION_ERROR"
        assert "past" in data["message"].lower() or "start date" in data["message"].lower()

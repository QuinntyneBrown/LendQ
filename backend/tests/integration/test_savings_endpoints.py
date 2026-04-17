"""Integration tests for savings goal endpoints.

Currently covers the past-deadline validation regression from
docs/bugs/2026-04-17-savings-goal-accepts-past-deadline.md. Expand as
additional savings flows get tested.
"""

import datetime


def _future_date(days: int = 30) -> str:
    return (datetime.date.today() + datetime.timedelta(days=days)).isoformat()


def _past_date(days: int = 30) -> str:
    return (datetime.date.today() - datetime.timedelta(days=days)).isoformat()


class TestSavingsGoalEndpoints:
    def test_list_savings_rejects_huge_per_page(
        self, client, borrower_user, auth_headers
    ):
        """Regression for 2026-04-17-pagination-params-uncapped (savings endpoint)."""
        resp = client.get(
            "/api/v1/savings?per_page=100000",
            headers=auth_headers(borrower_user),
        )
        assert resp.status_code == 422, resp.get_json()

    def test_create_goal_accepts_future_deadline(
        self, client, borrower_user, auth_headers
    ):
        resp = client.post(
            "/api/v1/savings",
            json={
                "name": "Vacation fund",
                "target_amount": 1000,
                "deadline": _future_date(90),
            },
            headers=auth_headers(borrower_user),
        )
        assert resp.status_code == 201, resp.get_json()

    def test_create_goal_accepts_no_deadline(
        self, client, borrower_user, auth_headers
    ):
        """Deadline is optional — request without it should succeed."""
        resp = client.post(
            "/api/v1/savings",
            json={"name": "Open-ended savings", "target_amount": 500},
            headers=auth_headers(borrower_user),
        )
        assert resp.status_code == 201, resp.get_json()

    def test_create_goal_rejects_past_deadline(
        self, client, borrower_user, auth_headers
    ):
        """Regression for 2026-04-17-savings-goal-accepts-past-deadline.

        Before this fix the backend accepted any deadline, including dates
        years in the past, so every "past-date goal" landed in the user's
        list as instantly Overdue.
        """
        resp = client.post(
            "/api/v1/savings",
            json={
                "name": "Back-dated goal",
                "target_amount": 500,
                "deadline": _past_date(30),
            },
            headers=auth_headers(borrower_user),
        )
        assert resp.status_code == 422, resp.get_json()
        data = resp.get_json()
        assert data["code"] == "VALIDATION_ERROR"
        assert "past" in data["message"].lower() or "deadline" in data["message"].lower()

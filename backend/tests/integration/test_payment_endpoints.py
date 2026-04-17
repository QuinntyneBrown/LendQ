import pytest
from tests.factories import LoanFactory, PaymentFactory


class TestPaymentEndpoints:
    def test_get_schedule(self, client, creditor_user, borrower_user, auth_headers):
        loan = LoanFactory.create(creditor_id=creditor_user.id, borrower_id=borrower_user.id)
        PaymentFactory.create(loan_id=loan.id, amount_due=500, due_date="2026-04-01")
        resp = client.get(
            f"/api/v1/loans/{loan.id}/schedule",
            headers=auth_headers(creditor_user),
        )
        assert resp.status_code == 200

    def test_record_payment_requires_idempotency_key(self, client, creditor_user, borrower_user, auth_headers):
        loan = LoanFactory.create(creditor_id=creditor_user.id, borrower_id=borrower_user.id)
        PaymentFactory.create(loan_id=loan.id, amount_due=500, due_date="2026-04-01")
        headers = auth_headers(creditor_user)
        resp = client.post(
            f"/api/v1/loans/{loan.id}/payments",
            json={"amount": 200, "paid_date": "2026-03-27"},
            headers=headers,
        )
        assert resp.status_code == 422
        data = resp.get_json()
        assert data["code"] == "VALIDATION_ERROR"

    def test_record_payment_with_idempotency_key(self, client, creditor_user, borrower_user, auth_headers):
        loan = LoanFactory.create(creditor_id=creditor_user.id, borrower_id=borrower_user.id)
        PaymentFactory.create(loan_id=loan.id, amount_due=500, due_date="2026-04-01")
        headers = auth_headers(creditor_user)
        headers["Idempotency-Key"] = "test-key-12345678"
        resp = client.post(
            f"/api/v1/loans/{loan.id}/payments",
            json={"amount": 200, "paid_date": "2026-03-27"},
            headers=headers,
        )
        assert resp.status_code == 201

    def test_unauthorized_user_cannot_view_schedule(self, client, creditor_user, borrower_user, admin_user, auth_headers):
        # Create loan between creditor and admin (not borrower_user)
        loan = LoanFactory.create(creditor_id=creditor_user.id, borrower_id=admin_user.id)
        resp = client.get(
            f"/api/v1/loans/{loan.id}/schedule",
            headers=auth_headers(borrower_user),
        )
        assert resp.status_code == 403

    def test_get_history(self, client, creditor_user, borrower_user, auth_headers):
        loan = LoanFactory.create(creditor_id=creditor_user.id, borrower_id=borrower_user.id)
        resp = client.get(
            f"/api/v1/loans/{loan.id}/history",
            headers=auth_headers(creditor_user),
        )
        assert resp.status_code == 200

    def test_reschedule_rejects_past_date(self, client, creditor_user, borrower_user, auth_headers):
        """Regression for 2026-04-17-reschedule-accepts-past-dates.

        Before the fix, POSTing new_date=2020-01-01 to the reschedule
        endpoint was accepted and the payment's due_date was overwritten
        to 2020. Now it must return 422.
        """
        loan = LoanFactory.create(creditor_id=creditor_user.id, borrower_id=borrower_user.id)
        payment = PaymentFactory.create(
            loan_id=loan.id, amount_due=500, due_date="2026-06-16"
        )

        resp = client.put(
            f"/api/v1/payments/{payment.id}/reschedule",
            json={"new_date": "2020-01-01"},
            headers=auth_headers(creditor_user),
        )

        assert resp.status_code == 422, resp.get_json()
        data = resp.get_json()
        assert data["code"] == "VALIDATION_ERROR"
        # Message must mention past / date so the UI can surface it.
        assert "past" in data["message"].lower() or "date" in data["message"].lower()

    def test_record_payment_rejects_future_paid_date(
        self, client, creditor_user, borrower_user, auth_headers
    ):
        """Regression for 2026-04-17-record-payment-accepts-future-paid-date.

        Before this fix, paid_date=2099-01-01 was accepted and the payment
        row was stamped decades in the future.
        """
        import datetime
        loan = LoanFactory.create(creditor_id=creditor_user.id, borrower_id=borrower_user.id)
        PaymentFactory.create(loan_id=loan.id, amount_due=500, due_date="2026-06-01")
        future = (datetime.date.today() + datetime.timedelta(days=30)).isoformat()

        headers = auth_headers(creditor_user)
        headers["Idempotency-Key"] = "future-paid-date-test"
        resp = client.post(
            f"/api/v1/loans/{loan.id}/payments",
            json={"amount": 100, "paid_date": future},
            headers=headers,
        )

        assert resp.status_code == 422, resp.get_json()
        data = resp.get_json()
        assert data["code"] == "VALIDATION_ERROR"
        assert "future" in data["message"].lower() or "paid" in data["message"].lower()

    def test_reschedule_accepts_today_or_future(self, client, creditor_user, borrower_user, auth_headers):
        """Sanity: the new date can be today or later."""
        import datetime
        loan = LoanFactory.create(creditor_id=creditor_user.id, borrower_id=borrower_user.id)
        payment = PaymentFactory.create(
            loan_id=loan.id, amount_due=500, due_date="2026-06-16"
        )
        future = (datetime.date.today() + datetime.timedelta(days=30)).isoformat()

        resp = client.put(
            f"/api/v1/payments/{payment.id}/reschedule",
            json={"new_date": future},
            headers=auth_headers(creditor_user),
        )

        assert resp.status_code == 200, resp.get_json()

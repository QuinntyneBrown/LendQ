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

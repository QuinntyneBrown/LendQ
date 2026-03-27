from datetime import date


class TestPaymentEndpoints:
    def _create_loan(self, client, creditor_user, borrower_user, auth_headers):
        headers = auth_headers(creditor_user)
        resp = client.post("/api/v1/loans", headers=headers, json={
            "borrower_id": borrower_user.id,
            "description": "Payment Test Loan",
            "principal": "1000.00",
            "interest_rate": "0.00",
            "repayment_frequency": "monthly",
            "num_payments": 10,
            "start_date": date.today().isoformat(),
        })
        return resp.get_json()["id"]

    def test_get_schedule(self, client, creditor_user, borrower_user, auth_headers):
        loan_id = self._create_loan(client, creditor_user, borrower_user, auth_headers)
        headers = auth_headers(creditor_user)
        response = client.get(f"/api/v1/loans/{loan_id}/schedule", headers=headers)
        assert response.status_code == 200
        data = response.get_json()
        assert len(data) == 10

    def test_record_payment(self, client, creditor_user, borrower_user, auth_headers):
        loan_id = self._create_loan(client, creditor_user, borrower_user, auth_headers)
        headers = auth_headers(creditor_user)
        response = client.post(f"/api/v1/loans/{loan_id}/payments", headers=headers, json={
            "amount": "100.00",
            "paid_date": date.today().isoformat(),
        })
        assert response.status_code == 201

    def test_get_history(self, client, creditor_user, borrower_user, auth_headers):
        loan_id = self._create_loan(client, creditor_user, borrower_user, auth_headers)
        headers = auth_headers(creditor_user)
        response = client.get(f"/api/v1/loans/{loan_id}/history", headers=headers)
        assert response.status_code == 200

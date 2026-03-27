from datetime import date


class TestLoanEndpoints:
    def test_create_loan(self, client, creditor_user, borrower_user, auth_headers):
        headers = auth_headers(creditor_user)
        response = client.post("/api/v1/loans", headers=headers, json={
            "borrower_id": borrower_user.id,
            "description": "Test Loan",
            "principal": "5000.00",
            "interest_rate": "0.00",
            "repayment_frequency": "monthly",
            "num_payments": 10,
            "start_date": date.today().isoformat(),
        })
        assert response.status_code == 201
        data = response.get_json()
        assert data["description"] == "Test Loan"
        assert data["principal"] == "5000.00"

    def test_list_loans(self, client, creditor_user, borrower_user, auth_headers):
        headers = auth_headers(creditor_user)
        # Create a loan first
        client.post("/api/v1/loans", headers=headers, json={
            "borrower_id": borrower_user.id,
            "description": "List Test Loan",
            "principal": "1000.00",
            "repayment_frequency": "monthly",
            "num_payments": 5,
            "start_date": date.today().isoformat(),
        })

        response = client.get("/api/v1/loans?tab=creditor", headers=headers)
        assert response.status_code == 200
        data = response.get_json()
        assert "items" in data

    def test_borrower_cannot_create_loan(self, client, borrower_user, auth_headers):
        headers = auth_headers(borrower_user)
        response = client.post("/api/v1/loans", headers=headers, json={
            "borrower_id": borrower_user.id,
            "description": "Unauthorized",
            "principal": "1000.00",
            "repayment_frequency": "monthly",
            "num_payments": 5,
            "start_date": date.today().isoformat(),
        })
        assert response.status_code == 403

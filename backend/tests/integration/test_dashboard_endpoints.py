class TestDashboardEndpoints:
    def test_get_dashboard(self, client, creditor_user, auth_headers):
        headers = auth_headers(creditor_user)
        response = client.get("/api/v1/dashboard", headers=headers)
        assert response.status_code == 200
        data = response.get_json()
        assert "summary" in data
        assert "loans" in data
        assert "activity" in data

    def test_get_summary(self, client, creditor_user, auth_headers):
        headers = auth_headers(creditor_user)
        response = client.get("/api/v1/dashboard/summary", headers=headers)
        assert response.status_code == 200
        data = response.get_json()
        assert "total_lent_out" in data
        assert "total_owed" in data

    def test_get_activity(self, client, creditor_user, auth_headers):
        headers = auth_headers(creditor_user)
        response = client.get("/api/v1/dashboard/activity?limit=10", headers=headers)
        assert response.status_code == 200

    def test_dashboard_requires_auth(self, client):
        response = client.get("/api/v1/dashboard")
        assert response.status_code == 401

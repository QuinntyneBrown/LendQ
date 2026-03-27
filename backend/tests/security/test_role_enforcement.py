class TestRoleEnforcement:
    def test_unauthenticated_access_denied(self, client):
        response = client.get("/api/v1/users")
        assert response.status_code == 401

    def test_borrower_cannot_access_admin_routes(self, client, borrower_user, auth_headers):
        headers = auth_headers(borrower_user)
        response = client.get("/api/v1/users", headers=headers)
        assert response.status_code == 403

    def test_creditor_cannot_access_admin_routes(self, client, creditor_user, auth_headers):
        headers = auth_headers(creditor_user)
        response = client.get("/api/v1/users", headers=headers)
        assert response.status_code == 403

    def test_admin_can_access_admin_routes(self, client, admin_user, auth_headers):
        headers = auth_headers(admin_user)
        response = client.get("/api/v1/users", headers=headers)
        assert response.status_code == 200

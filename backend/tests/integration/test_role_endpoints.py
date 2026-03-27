class TestRoleEndpoints:
    def test_list_roles(self, client, admin_user, auth_headers):
        headers = auth_headers(admin_user)
        response = client.get("/api/v1/roles", headers=headers)
        assert response.status_code == 200
        data = response.get_json()
        assert len(data) >= 3
        role_names = [r["name"] for r in data]
        assert "Admin" in role_names
        assert "Creditor" in role_names
        assert "Borrower" in role_names

    def test_list_roles_unauthorized(self, client, borrower_user, auth_headers):
        headers = auth_headers(borrower_user)
        response = client.get("/api/v1/roles", headers=headers)
        assert response.status_code == 403

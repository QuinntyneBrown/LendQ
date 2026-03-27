class TestUserEndpoints:
    def test_list_users_as_admin(self, client, admin_user, auth_headers):
        headers = auth_headers(admin_user)
        response = client.get("/api/v1/users", headers=headers)
        assert response.status_code == 200
        data = response.get_json()
        assert "items" in data
        assert "total" in data

    def test_list_users_unauthorized(self, client, borrower_user, auth_headers):
        headers = auth_headers(borrower_user)
        response = client.get("/api/v1/users", headers=headers)
        assert response.status_code == 403

    def test_create_user_as_admin(self, client, admin_user, auth_headers):
        headers = auth_headers(admin_user)
        response = client.post("/api/v1/users", headers=headers, json={
            "name": "New Admin User",
            "email": "newadminuser@test.com",
            "password": "password123",
        })
        assert response.status_code == 201
        data = response.get_json()
        assert data["name"] == "New Admin User"

    def test_get_user(self, client, admin_user, borrower_user, auth_headers):
        headers = auth_headers(admin_user)
        response = client.get(f"/api/v1/users/{borrower_user.id}", headers=headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data["email"] == "borrower@test.com"

    def test_delete_user_soft_deletes(self, client, admin_user, auth_headers):
        headers = auth_headers(admin_user)
        # Create user first
        create_resp = client.post("/api/v1/users", headers=headers, json={
            "name": "To Delete",
            "email": "todelete@test.com",
            "password": "password123",
        })
        user_id = create_resp.get_json()["id"]

        response = client.delete(f"/api/v1/users/{user_id}", headers=headers)
        assert response.status_code == 204

        get_resp = client.get(f"/api/v1/users/{user_id}", headers=headers)
        assert get_resp.get_json()["is_active"] is False

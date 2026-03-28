import pytest


class TestUserEndpoints:
    def test_list_users_requires_admin(self, client, creditor_user, auth_headers):
        resp = client.get("/api/v1/users/", headers=auth_headers(creditor_user))
        assert resp.status_code == 403

    def test_list_users_as_admin(self, client, admin_user, auth_headers):
        resp = client.get("/api/v1/users/", headers=auth_headers(admin_user))
        assert resp.status_code == 200
        data = resp.get_json()
        assert "items" in data

    def test_create_user(self, client, admin_user, auth_headers):
        resp = client.post("/api/v1/users/", json={
            "name": "New User",
            "email": "newuser@test.com",
            "password": "password123",
        }, headers=auth_headers(admin_user))
        assert resp.status_code == 201

    def test_get_user(self, client, admin_user, creditor_user, auth_headers):
        resp = client.get(f"/api/v1/users/{creditor_user.id}", headers=auth_headers(admin_user))
        assert resp.status_code == 200

    def test_patch_user(self, client, admin_user, creditor_user, auth_headers):
        resp = client.patch(f"/api/v1/users/{creditor_user.id}", json={
            "name": "Updated Name",
        }, headers=auth_headers(admin_user))
        assert resp.status_code == 200

    def test_delete_user(self, client, admin_user, borrower_user, auth_headers):
        resp = client.delete(f"/api/v1/users/{borrower_user.id}", headers=auth_headers(admin_user))
        assert resp.status_code == 200

    def test_list_borrowers(self, client, creditor_user, borrower_user, auth_headers):
        resp = client.get("/api/v1/users/borrowers", headers=auth_headers(creditor_user))
        assert resp.status_code == 200
        data = resp.get_json()
        assert "items" in data

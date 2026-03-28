import pytest


class TestRoleEnforcement:
    def test_unauthenticated_request_returns_401(self, client):
        resp = client.get("/api/v1/users/")
        assert resp.status_code == 401
        data = resp.get_json()
        assert data["code"] == "AUTHENTICATION_ERROR"

    def test_unauthorized_role_returns_403(self, client, borrower_user, auth_headers):
        resp = client.get("/api/v1/users/", headers=auth_headers(borrower_user))
        assert resp.status_code == 403

    def test_admin_can_access_users(self, client, admin_user, auth_headers):
        resp = client.get("/api/v1/users/", headers=auth_headers(admin_user))
        assert resp.status_code == 200

    def test_error_response_format(self, client):
        resp = client.get("/api/v1/users/")
        data = resp.get_json()
        assert "code" in data
        assert "message" in data
        assert "request_id" in data

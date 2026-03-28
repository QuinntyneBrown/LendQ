import pytest


class TestAuthEndpoints:
    def test_signup_returns_201(self, client):
        resp = client.post("/api/v1/auth/signup", json={
            "name": "Test User",
            "email": "new@test.com",
            "password": "password123",
            "confirm_password": "password123",
        })
        assert resp.status_code == 201

    def test_signup_duplicate_email_returns_409(self, client, creditor_user):
        resp = client.post("/api/v1/auth/signup", json={
            "name": "Duplicate",
            "email": creditor_user.email,
            "password": "password123",
            "confirm_password": "password123",
        })
        assert resp.status_code == 409
        data = resp.get_json()
        assert data["code"] == "CONFLICT"

    def test_login_returns_token_bundle(self, client, creditor_user):
        resp = client.post("/api/v1/auth/login", json={
            "email": creditor_user.email,
            "password": "testpassword123",
        })
        assert resp.status_code == 200
        data = resp.get_json()
        assert "access_token" in data
        assert "expires_in_seconds" in data
        assert "csrf_token" in data
        assert "user" in data
        assert data["user"]["email"] == creditor_user.email
        # Session cookie should be set
        assert "lendq_session" in resp.headers.get("Set-Cookie", "")

    def test_login_invalid_credentials_returns_401(self, client):
        resp = client.post("/api/v1/auth/login", json={
            "email": "noone@test.com",
            "password": "wrong",
        })
        assert resp.status_code == 401
        data = resp.get_json()
        assert data["code"] == "AUTHENTICATION_ERROR"
        assert "request_id" in data

    def test_forgot_password_returns_202(self, client, creditor_user):
        resp = client.post("/api/v1/auth/forgot-password", json={
            "email": creditor_user.email,
        })
        assert resp.status_code == 202

    def test_get_me_requires_auth(self, client):
        resp = client.get("/api/v1/auth/me")
        assert resp.status_code == 401

    def test_get_me_returns_user_info(self, client, creditor_user, auth_headers):
        resp = client.get("/api/v1/auth/me", headers=auth_headers(creditor_user))
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["email"] == creditor_user.email
        assert "roles" in data

    def test_logout_returns_204(self, client, creditor_user, auth_headers):
        resp = client.post("/api/v1/auth/logout", headers=auth_headers(creditor_user))
        assert resp.status_code == 204

    def test_logout_all_returns_204(self, client, creditor_user, auth_headers):
        resp = client.post("/api/v1/auth/logout-all", headers=auth_headers(creditor_user))
        assert resp.status_code == 204

    def test_list_sessions(self, client, creditor_user, auth_headers):
        resp = client.get("/api/v1/auth/sessions", headers=auth_headers(creditor_user))
        assert resp.status_code == 200
        data = resp.get_json()
        assert "items" in data

    def test_email_verification_confirm_invalid_token(self, client):
        resp = client.post("/api/v1/auth/email-verification/confirm", json={
            "token": "invalid-token",
        })
        assert resp.status_code == 401

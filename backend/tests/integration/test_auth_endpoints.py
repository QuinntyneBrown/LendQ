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

    def test_signup_duplicate_email_is_anti_enumeration(self, client, creditor_user):
        """Regression for 2026-04-17-signup-user-enumeration-via-409.

        Signing up with an existing email must be indistinguishable
        (status + body shape) from signing up with a fresh email, so a
        public attacker can't enumerate real accounts via this endpoint.
        Admin-initiated POST /users keeps its 409 — different endpoint.
        """
        fresh = client.post(
            "/api/v1/auth/signup",
            json={
                "name": "Fresh",
                "email": "fresh-for-enum-test@test.com",
                "password": "password123",
                "confirm_password": "password123",
            },
        )
        dup = client.post(
            "/api/v1/auth/signup",
            json={
                "name": "Duplicate",
                "email": creditor_user.email,
                "password": "password123",
                "confirm_password": "password123",
            },
        )

        assert dup.status_code == fresh.status_code, (
            "Duplicate-email signup must return the same status as a fresh signup "
            "to prevent user enumeration. See "
            "docs/bugs/2026-04-17-signup-user-enumeration-via-409.md."
        )

    def test_signup_duplicate_does_not_create_a_new_row(
        self, client, creditor_user, app
    ):
        """Tightening: the duplicate path must not leak a second row in the DB."""
        from app.models.user import User

        before = User.query.filter_by(email=creditor_user.email).count()
        client.post(
            "/api/v1/auth/signup",
            json={
                "name": "Duplicate",
                "email": creditor_user.email,
                "password": "password123",
                "confirm_password": "password123",
            },
        )
        after = User.query.filter_by(email=creditor_user.email).count()
        assert before == after, "Duplicate signup must not create a new user row"

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

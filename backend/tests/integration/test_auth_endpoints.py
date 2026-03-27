import json

import pytest


class TestAuthEndpoints:
    def test_login_success(self, client, borrower_user):
        response = client.post("/api/v1/auth/login", json={
            "email": "borrower@test.com",
            "password": "testpassword123",
        })
        assert response.status_code == 200
        data = response.get_json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "Bearer"

    def test_login_invalid_credentials(self, client):
        response = client.post("/api/v1/auth/login", json={
            "email": "nobody@test.com",
            "password": "wrongpassword",
        })
        assert response.status_code == 401

    def test_signup_success(self, client):
        response = client.post("/api/v1/auth/signup", json={
            "name": "Signup Test",
            "email": "signuptest@test.com",
            "password": "password123",
            "confirm_password": "password123",
        })
        assert response.status_code == 201
        data = response.get_json()
        assert data["name"] == "Signup Test"
        assert data["email"] == "signuptest@test.com"

    def test_signup_duplicate_email(self, client, borrower_user):
        response = client.post("/api/v1/auth/signup", json={
            "name": "Duplicate",
            "email": "borrower@test.com",
            "password": "password123",
            "confirm_password": "password123",
        })
        assert response.status_code == 409

    def test_forgot_password_always_succeeds(self, client):
        response = client.post("/api/v1/auth/forgot-password", json={
            "email": "nonexistent@test.com",
        })
        assert response.status_code == 200

    def test_refresh_token(self, client, borrower_user):
        login_resp = client.post("/api/v1/auth/login", json={
            "email": "borrower@test.com",
            "password": "testpassword123",
        })
        refresh_token = login_resp.get_json()["refresh_token"]

        response = client.post("/api/v1/auth/refresh", json={
            "refresh_token": refresh_token,
        })
        assert response.status_code == 200
        data = response.get_json()
        assert "access_token" in data

    def test_logout(self, client, borrower_user, auth_headers):
        headers = auth_headers(borrower_user)
        response = client.post("/api/v1/auth/logout", headers=headers, json={})
        assert response.status_code == 204

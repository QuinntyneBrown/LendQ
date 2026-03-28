import pytest


class TestDashboardEndpoints:
    def test_get_dashboard(self, client, creditor_user, auth_headers):
        resp = client.get("/api/v1/dashboard/", headers=auth_headers(creditor_user))
        assert resp.status_code == 200

    def test_get_summary(self, client, creditor_user, auth_headers):
        resp = client.get("/api/v1/dashboard/summary", headers=auth_headers(creditor_user))
        assert resp.status_code == 200

    def test_get_activity(self, client, creditor_user, auth_headers):
        resp = client.get("/api/v1/dashboard/activity", headers=auth_headers(creditor_user))
        assert resp.status_code == 200

    def test_dashboard_requires_auth(self, client):
        resp = client.get("/api/v1/dashboard/")
        assert resp.status_code == 401

import pytest


class TestRoleEndpoints:
    def test_list_roles_requires_admin(self, client, creditor_user, auth_headers):
        resp = client.get("/api/v1/roles/", headers=auth_headers(creditor_user))
        assert resp.status_code == 403

    def test_list_roles_as_admin(self, client, admin_user, auth_headers):
        resp = client.get("/api/v1/roles/", headers=auth_headers(admin_user))
        assert resp.status_code == 200

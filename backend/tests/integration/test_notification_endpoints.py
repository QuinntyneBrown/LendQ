import pytest
from tests.factories import NotificationFactory


class TestNotificationEndpoints:
    def test_list_notifications(self, client, creditor_user, auth_headers):
        NotificationFactory.create(user_id=creditor_user.id, notification_type="PAYMENT_DUE")
        resp = client.get("/api/v1/notifications/", headers=auth_headers(creditor_user))
        assert resp.status_code == 200

    def test_get_unread_count(self, client, creditor_user, auth_headers):
        NotificationFactory.create(user_id=creditor_user.id, notification_type="PAYMENT_DUE")
        resp = client.get("/api/v1/notifications/unread-count", headers=auth_headers(creditor_user))
        assert resp.status_code == 200
        data = resp.get_json()
        assert "count" in data

    def test_mark_read_uses_post(self, client, creditor_user, auth_headers):
        notif = NotificationFactory.create(user_id=creditor_user.id, notification_type="PAYMENT_DUE")
        resp = client.post(
            f"/api/v1/notifications/{notif.id}/read",
            headers=auth_headers(creditor_user),
        )
        assert resp.status_code == 204

    def test_mark_all_read_uses_post(self, client, creditor_user, auth_headers):
        resp = client.post("/api/v1/notifications/read-all", headers=auth_headers(creditor_user))
        assert resp.status_code == 204

    def test_get_preferences(self, client, creditor_user, auth_headers):
        resp = client.get("/api/v1/notification-preferences/", headers=auth_headers(creditor_user))
        assert resp.status_code == 200
        data = resp.get_json()
        assert "payment_due_email" in data

    def test_update_preferences(self, client, creditor_user, auth_headers):
        resp = client.put("/api/v1/notification-preferences/", json={
            "payment_due_email": False,
        }, headers=auth_headers(creditor_user))
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["payment_due_email"] is False

from app.extensions import db
from tests.factories import NotificationFactory


class TestNotificationEndpoints:
    def test_list_notifications(self, client, borrower_user, auth_headers):
        with client.application.app_context():
            NotificationFactory.create(user_id=borrower_user.id, message="Test 1")
            NotificationFactory.create(user_id=borrower_user.id, message="Test 2")
            db.session.commit()

        headers = auth_headers(borrower_user)
        response = client.get("/api/v1/notifications", headers=headers)
        assert response.status_code == 200
        data = response.get_json()
        assert "items" in data
        assert data["total"] >= 2

    def test_get_unread_count(self, client, borrower_user, auth_headers):
        headers = auth_headers(borrower_user)
        response = client.get("/api/v1/notifications/count", headers=headers)
        assert response.status_code == 200
        data = response.get_json()
        assert "unread_count" in data

    def test_mark_all_read(self, client, borrower_user, auth_headers):
        headers = auth_headers(borrower_user)
        response = client.put("/api/v1/notifications/read-all", headers=headers)
        assert response.status_code == 204

    def test_notifications_require_auth(self, client):
        response = client.get("/api/v1/notifications")
        assert response.status_code == 401

import pytest


class TestSecurityHeaders:
    def test_security_headers_present(self, client):
        resp = client.get("/health/live")
        assert "X-Content-Type-Options" in resp.headers
        assert "X-Frame-Options" in resp.headers

    def test_request_id_propagated(self, client):
        resp = client.get("/health/live", headers={"X-Request-ID": "test-req-123"})
        assert resp.headers.get("X-Request-ID") == "test-req-123"

    def test_request_id_generated(self, client):
        resp = client.get("/health/live")
        assert resp.headers.get("X-Request-ID") is not None

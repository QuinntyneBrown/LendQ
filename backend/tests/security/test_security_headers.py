class TestSecurityHeaders:
    def test_security_headers_present(self, client):
        response = client.get("/health/live")
        assert response.headers.get("X-Content-Type-Options") == "nosniff"
        assert response.headers.get("X-Frame-Options") == "DENY"
        assert response.headers.get("X-XSS-Protection") == "1; mode=block"
        assert "max-age" in response.headers.get("Strict-Transport-Security", "")
        assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"

    def test_request_id_header(self, client):
        response = client.get("/health/live")
        assert response.headers.get("X-Request-ID") is not None

    def test_custom_request_id_propagated(self, client):
        response = client.get("/health/live", headers={"X-Request-ID": "test-req-123"})
        assert response.headers.get("X-Request-ID") == "test-req-123"

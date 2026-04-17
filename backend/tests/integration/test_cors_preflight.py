"""CORS preflight tests.

Regression for docs/bugs/2026-04-17-cors-blocks-idempotency-key-header.md —
ensures Flask-CORS advertises every custom header the frontend actually sends
on `Access-Control-Allow-Headers`.

The frontend sends these custom headers today:
- Idempotency-Key (payments, deposits, withdrawals, savings add funds)
- Authorization (every authenticated request)
- Content-Type (JSON bodies)

If any of these is missing from the preflight response, the browser rejects
the real request and the mutation never reaches the backend.
"""


def _preflight(client, path, request_headers):
    return client.options(
        path,
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": request_headers,
        },
    )


class TestCORSPreflight:
    def test_preflight_allows_idempotency_key(self, client):
        """Regression — bug 2026-04-17-cors-blocks-idempotency-key-header.

        The frontend sends `Idempotency-Key` on every money-moving POST. CORS
        must advertise it, or the browser rejects the preflight and the
        request never fires.
        """
        resp = _preflight(
            client,
            "/api/v1/loans/00000000-0000-0000-0000-000000000000/payments",
            "authorization,content-type,idempotency-key",
        )

        allow = resp.headers.get("Access-Control-Allow-Headers", "")
        assert "idempotency-key" in allow.lower(), (
            "CORS preflight must advertise Idempotency-Key. See "
            "docs/bugs/2026-04-17-cors-blocks-idempotency-key-header.md. "
            f"Got Access-Control-Allow-Headers: {allow!r}"
        )

    def test_preflight_allows_authorization_and_content_type(self, client):
        resp = _preflight(
            client,
            "/api/v1/loans",
            "authorization,content-type",
        )

        allow = resp.headers.get("Access-Control-Allow-Headers", "").lower()
        assert "authorization" in allow
        assert "content-type" in allow

    def test_preflight_from_configured_origin_is_allowed(self, client):
        resp = _preflight(
            client,
            "/api/v1/loans",
            "content-type",
        )

        allow_origin = resp.headers.get("Access-Control-Allow-Origin")
        assert allow_origin in ("http://localhost:5173", "*"), (
            f"Expected the dev frontend origin to be allowed, got {allow_origin!r}"
        )

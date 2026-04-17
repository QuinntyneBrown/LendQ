---
id: 2026-04-17-cors-blocks-idempotency-key-header
title: CORS preflight blocks Idempotency-Key header — Record Payment, Deposit, Add Funds all fail
status: open
severity: critical
area: backend
reported_by: claude
reported_at: 2026-04-17
---

## Summary

The frontend sends an `Idempotency-Key` header on three mutating endpoints (record payment, bank deposit/withdraw, savings add funds). The backend's Flask-CORS configuration does not include that header in `Access-Control-Allow-Headers`, so the browser rejects the preflight and the request never reaches the backend. Every one of those flows is broken on staging for any browser that enforces CORS (i.e. all of them).

## Environment

- Environment: staging (`https://lemon-wave-0a1790b0f.6.azurestaticapps.net/`)
- API: `https://lendq-api-staging.wittyglacier-a7ff8abf.eastus2.azurecontainerapps.io`
- Commit / version: `vbb4c5b2`
- Browser: Chromium via `playwright-cli`
- User role: Creditor (`creditor@lendq.local`)

## Steps to reproduce

1. Sign in as a creditor.
2. Open any active loan (e.g. `/loans/2528d433-8514-4110-a8ee-0c60245a7ead`, one of the "Personal loan for home improvement" fixtures).
3. Click **Record Payment**.
4. Accept the pre-filled amount and date; click **Record Payment** on the dialog footer.
5. Open DevTools → Console.

## Expected behavior

Per [`docs/user-guide/05-payments.md`](../user-guide/05-payments.md#record-a-payment), the dialog should:

1. POST to `/api/v1/loans/:id/payments` with an `Idempotency-Key` header.
2. Update the loan's `outstanding_balance`.
3. Mark the targeted scheduled payment `PAID` and close the dialog.

## Actual behavior

The POST never leaves the browser. Console:

```
[ERROR] Access to XMLHttpRequest at
  'https://lendq-api-staging.wittyglacier-a7ff8abf.eastus2.azurecontainerapps.io/api/v1/loans/.../payments'
  from origin 'https://lemon-wave-0a1790b0f.6.azurestaticapps.net'
  has been blocked by CORS policy:
  Request header field idempotency-key is not allowed by Access-Control-Allow-Headers
  in preflight response.
[ERROR] Failed to load resource: net::ERR_FAILED
```

The loan is not updated; the user sees no feedback in the UI because the catch branch only shows a toast on a response-level error, not on a network-level CORS rejection.

## Root cause analysis

`backend/app/__init__.py:25`:

```python
cors.init_app(app, origins=app.config["CORS_ORIGINS"], supports_credentials=True)
```

`Flask-CORS` defaults `allow_headers` to `["*"]` when not specified, but in preflight handling it only echoes back a fixed set of "simple" headers plus `Authorization` and `Content-Type` — custom headers like `Idempotency-Key` must be explicitly listed.

The frontend sends `Idempotency-Key` in three places:

- `frontend/src/payments/hooks.ts:55` (record payment)
- `frontend/src/bank-account/hooks.ts:64` (deposit)
- `frontend/src/bank-account/hooks.ts:77` (withdraw)
- `frontend/src/savings/hooks.ts:111` (add funds to a goal)

So the blast radius is every user-initiated mutation that touches money on staging.

## Suggested fix

Pass an explicit `allow_headers` list to `cors.init_app`:

```python
cors.init_app(
    app,
    origins=app.config["CORS_ORIGINS"],
    supports_credentials=True,
    allow_headers=[
        "Content-Type",
        "Authorization",
        "Idempotency-Key",
        "X-Request-ID",
    ],
)
```

`X-Request-ID` is listed because the security-headers middleware already forwards it and a future client may send one.

## Impact and workaround

Critical. None of the money-moving flows work on staging. There is no workaround short of making the request from a non-browser client (curl) that bypasses CORS.

Read-only flows (dashboard, loan list, loan detail, user management) are unaffected because they don't send custom headers.

## Related

- `backend/app/__init__.py:25` — CORS init call
- `backend/app/middleware/cors.py` — placeholder module, could host the full config
- Front-end callers: `payments/hooks.ts`, `bank-account/hooks.ts`, `savings/hooks.ts`

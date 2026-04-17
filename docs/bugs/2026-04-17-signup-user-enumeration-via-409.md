---
id: 2026-04-17-signup-user-enumeration-via-409
title: Public signup reveals which emails are registered (409 on duplicates)
status: open
severity: medium
area: backend
reported_by: claude
reported_at: 2026-04-17
---

## Summary

`POST /api/v1/auth/signup` with an email that's already registered returns **409 CONFLICT "A user with this email already exists"**. That response is unambiguous — an attacker can use `/auth/signup` as an email-enumeration oracle to determine which addresses are real users.

Contrast with `/auth/forgot-password`, which the user guide explicitly documents as anti-enumeration:

> LendQ always returns the same "check your email" message regardless of whether the address is on file, so nobody can use the form to enumerate accounts.

Signup should follow the same policy.

## Environment

- Environment: staging (`https://lemon-wave-0a1790b0f.6.azurestaticapps.net/`)
- Commit / version: `v358413f`
- No session required — this is a public endpoint.

## Steps to reproduce

```
POST /api/v1/auth/signup
{ "name": "Dup Audit", "email": "creditor@lendq.local",
  "password": "Password123!", "confirm_password": "Password123!" }
→ 409 { "code": "CONFLICT", "message": "A user with this email already exists" }

POST /api/v1/auth/signup
{ ..., "email": "never-seen-before@example.com", ... }
→ 202 / 201 with "check your email" message
```

The difference between the two responses leaks whether the email is registered.

## Expected behavior

Signup should return the same success-shaped response whether the email is new or already registered. The canonical pattern is:

- Fresh email → create user, send verification email, return 202 "Check your email to verify your address".
- Existing email → do NOT create a duplicate user, send an email to the address saying "someone tried to create an account using your email; if that was you and you already have an account, use the password reset flow", return the same 202 response.

The frontend's current "email already in use" inline copy on the signup form is purely cosmetic for legitimate users; replacing it with a neutral "Check your email" message removes the enumeration vector without hurting UX.

## Actual behavior

`backend/app/services/auth_service.py:signup` raises `ConflictError("A user with this email already exists")`, which the error handler turns into 409.

## Root cause analysis

- `backend/app/services/auth_service.py` — signup's duplicate-email branch raises `ConflictError`.
- `backend/app/controllers/auth_controller.py` — passes the exception through; no anti-enumeration wrapping.

## Suggested fix

1. Detect duplicate in `AuthService.signup`.
2. If duplicate: skip user creation, log a warning with the request ID, fire an info email to the address (deferred to follow-up if email infra isn't ready), return the same success response shape as fresh signup.
3. Do NOT raise `ConflictError` on the public signup path.

The Admin `POST /users` endpoint must keep its 409 behaviour — admins are authenticated and expect a clear duplicate error.

## Impact and workaround

Medium. Enumerating the user list of a lending platform is low-grade recon but non-zero risk (targets for phishing, password spraying, etc.). Rate limit on /auth/signup narrows the window but doesn't close it.

No user workaround; fix is server-side.

## Related

- Sibling: `/auth/forgot-password` is already anti-enumeration (confirmed by user-guide wording and existing tests).
- File: `backend/app/services/auth_service.py`
- Guide: `docs/user-guide/01-getting-started.md#3-verify-your-email`

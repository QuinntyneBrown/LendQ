---
id: 2026-04-17-long-email-crashes-signup
title: Signup 500s on very long email addresses (no length cap)
status: fixed
severity: medium
area: backend
reported_by: claude
reported_at: 2026-04-17
fixed_at: 2026-04-17
fixed_in: backend/app/schemas/auth_schemas.py (`_EMAIL_LENGTH = validate.Length(max=255)` applied to every email field)
---

## Summary

`POST /api/v1/auth/signup` with an email whose local-part is 300 characters returns **500 Internal Server Error**. Marshmallow's `fields.Email` validates syntax but not length; the DB column presumably has a `VARCHAR(255)` cap which raises on insert.

Email probes that worked correctly:

| Input                        | Response |
|------------------------------|----------|
| `notanemail`                 | 422 ✓    |
| `missing@`                   | 422 ✓    |
| `@nodomain.com`              | 422 ✓    |
| `spaces in@email.com`        | 422 ✓    |
| `test@example`               | 422 ✓    |
| `"a" * 300 + "@example.com"` | **500 ✗** |

## Environment

- Environment: staging (`https://lemon-wave-0a1790b0f.6.azurestaticapps.net/`)
- Commit / version: `v501ecb8`

## Steps to reproduce

```
POST /api/v1/auth/signup
{ "name": "Email-audit",
  "email": "aaaaaaaaa...[300 chars]...aaaaaaaaaaaa@example.com",
  "password": "Password123",
  "confirm_password": "Password123" }
→ 500 INTERNAL_ERROR
```

## Expected behavior

Reject at the schema layer with 422 and a clear message. RFC 5321 puts max email length at 320 chars; 255 is the conventional DB column size and a safe ceiling.

## Actual behavior

500. Request ID is returned to the client, which leaks that the endpoint is crashy on pathological inputs.

## Root cause analysis

`backend/app/schemas/auth_schemas.py` — `email = fields.Email(required=True)` has no `validate.Length(...)`. The crash happens downstream when SQLAlchemy tries to insert into the `users.email` column.

## Suggested fix

Add a length bound to every email field in the auth schemas:

```python
email = fields.Email(
    required=True,
    validate=validate.Length(max=255),
)
```

Same treatment for:
- `LoginRequestSchema.email`
- `SignUpRequestSchema.email`
- `ForgotPasswordRequestSchema.email`
- `EmailVerificationResendSchema.email`

(Any `.email` field on the admin users endpoint should get the same cap.)

## Impact and workaround

Medium. 500 is more revealing than 422 and (alongside other size-unbounded fields) is a cheap way to surface internal error stacks to a probe.

## Related

- Sibling: `2026-04-17-num-payments-unbounded.md` and `2026-04-17-interest-rate-no-bounds.md` — same class of "no upper bound in schema → service crash" bug.
- File: `backend/app/schemas/auth_schemas.py`

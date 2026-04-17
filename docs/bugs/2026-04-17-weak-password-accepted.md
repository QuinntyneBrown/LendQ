---
id: 2026-04-17-weak-password-accepted
title: Signup accepts trivially weak passwords ("password", "        ")
status: fixed
severity: high
area: backend
reported_by: claude
reported_at: 2026-04-17
fixed_at: 2026-04-17
fixed_in: backend/app/schemas/auth_schemas.py (shared _PASSWORD_VALIDATORS with letter+digit regex) + user guide updated
---

## Summary

`POST /api/v1/auth/signup` only enforces the minimum length of 8 characters. Six weak-password probes on staging:

| Password          | Expected | Actual |
|-------------------|----------|--------|
| `"a"`             | reject   | 422 ✓  |
| `"1234"`          | reject   | 422 ✓  |
| `"1234567"`       | reject   | 422 ✓  |
| `"abcdefgh"`      | reject   | **201 ✗** |
| `"password"`      | reject   | **201 ✗** |
| `"        "` (8 spaces) | reject | **201 ✗** |

"password" is the single most common breached password. 8 spaces is clearly accidental input. Both should never be accepted by a lending platform.

## Environment

- Environment: staging (`https://lemon-wave-0a1790b0f.6.azurestaticapps.net/`)
- Commit / version: `v9f5b4a3`
- No session required — public endpoint.

## Steps to reproduce

```
POST /api/v1/auth/signup
{ "name": "pw-audit", "email": "unique@example.com",
  "password": "password", "confirm_password": "password" }
→ 201 Created
```

## Expected behavior

Require at minimum:

1. At least one letter.
2. At least one digit.
3. Not whitespace-only.

Ideally also:

- Blacklist of the most common passwords (password, qwerty, letmein, 12345678, etc.) — NIST SP 800-63B recommends a "known-compromised" list.
- Document the requirements in `docs/user-guide/01-getting-started.md`.

## Actual behavior

Any 8+ character string is accepted, including all-space and the literal word "password".

## Root cause analysis

`backend/app/schemas/auth_schemas.py` — SignUpRequestSchema's `password` field uses only `validate.Length(min=8)`. No regex / blacklist / service-layer check.

## Suggested fix

Add a schema-level regex requiring a letter + digit, and reject whitespace-only:

```python
password = fields.String(
    required=True,
    validate=[
        validate.Length(min=8, max=128),
        validate.Regexp(
            r"^(?=.*[A-Za-z])(?=.*\d).+$",
            error="Password must contain at least one letter and one digit",
        ),
    ],
)
```

(Plus update the user guide to document the new requirement.)

A follow-up can add a common-password blacklist — out of scope here.

## Impact and workaround

High. Every new public signup today can pick "password" or 8 spaces. Any credential-stuffing or dictionary attack wins on the first try against accounts created with such passwords.

No user workaround; server-side fix.

## Related

- Schema: `backend/app/schemas/auth_schemas.py`
- Guide: `docs/user-guide/01-getting-started.md#2-create-an-account` (should be updated to advertise the new rule)

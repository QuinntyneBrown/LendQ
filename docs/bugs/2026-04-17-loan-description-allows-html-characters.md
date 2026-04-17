---
id: 2026-04-17-loan-description-allows-html-characters
title: Loan description accepts HTML-looking text (data hygiene, not XSS)
status: fixed
severity: low
area: backend
reported_by: claude
reported_at: 2026-04-17
fixed_at: 2026-04-17
fixed_in: backend/app/schemas/loan_schemas.py (angle-bracket regex on description + notes)
---

## Summary

Loan `description` is stored verbatim — no character-class validation. Attempting an XSS via `<img src=x onerror="…">` is correctly defused by React's default escaping on render (no `dangerouslySetInnerHTML` anywhere in `frontend/src`), so there is no security impact. But the raw HTML-looking text ends up in the h1 of the loan detail page and in the list table, breaking layout and looking awful.

Not a security bug — a data-hygiene one. Filed as a separate record so the session's systematic probing is captured.

## Environment

- Environment: staging (`https://lemon-wave-0a1790b0f.6.azurestaticapps.net/`)
- Commit / version: `v82d37ea`
- User role: Creditor (`creditor@lendq.local`)

## Steps to reproduce

Create a loan with an HTML-looking description:

```
POST /api/v1/loans
{ ..., "description": "<img src=x onerror=\"window.xssPwned=1\">XSS audit" }
→ 201 Created
```

Open the loan detail page. The heading wraps an `<img … >` literal across three lines; the loan list table cell shows the same raw string.

## Expected behavior

Reject or normalize the description at the schema layer so descriptions stay plain human text. A minimum viable check is to reject any `<` or `>` characters:

```python
description = fields.String(
    required=True,
    validate=[
        validate.Length(min=1, max=500),
        validate.Regexp(r"^[^<>]+$", error="Description cannot contain < or > characters"),
    ],
)
```

Or, for a lighter touch, strip HTML tags server-side before persisting.

## Actual behavior

Saved verbatim. Rendered as literal text in h1 and list cells. No script execution (React escapes), but the UI looks terrible and the data is dirtier than it should be.

## Root cause analysis

`backend/app/schemas/loan_schemas.py:39` — `description = fields.String(required=True, validate=validate.Length(min=1, max=500))`. Length bound only; no character class.

Same pattern on:
- `loan_schemas.UpdateLoanRequestSchema.description`
- `recurring_loan_schemas.CreateRecurringLoanSchema.description_template`
- `savings_goal_schemas` name/description fields (worth checking in a follow-up)

## Suggested fix

Schema-level regex rejecting angle brackets (and arguably ASCII control characters). Apply to every "human-readable text" field. This session scope: loan `description` only.

## Impact and workaround

Low. No exploit is possible because of React's escaping. Impact is purely cosmetic: the one audit loan (`d643ea0b-aa8e-42a3-9bf9-85f482dce971`) shows raw `<img ...>` text in the heading and will until it's manually renamed. Workaround: use **Edit Loan** to change the description after the fix lands.

## Related

- No-ops confirmed this iteration (filed here so the positive findings survive):
  - React escapes all user-supplied strings; no `dangerouslySetInnerHTML` anywhere in `frontend/src`.
  - Auth rate limit (`RATE_LIMIT_AUTH=30/minute`) enforced — 30 × 401 then 5 × 429 from 35 back-to-back wrong passwords.
  - Signup privilege escalation blocked: `roles`, `is_admin`, `role` all return 422 "Unknown field".
- File: `backend/app/schemas/loan_schemas.py:39`

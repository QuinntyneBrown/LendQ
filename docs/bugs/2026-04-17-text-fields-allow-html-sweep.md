---
id: 2026-04-17-text-fields-allow-html-sweep
title: Angle-bracket guard missing from most user-supplied text fields
status: fixed
severity: low
area: backend
reported_by: claude
reported_at: 2026-04-17
fixed_at: 2026-04-17
fixed_in: auth_schemas.py, user_schemas.py, payment_schemas.py (notes + reschedule reason + pause reason), recurring_loan_schemas.py (description_template), bank_account_schemas.py (reason + description + source_description)
---

## Summary

Extending the iter-21 (loan description) and iter-28 (savings name/description) fixes: the same shared `PLAIN_TEXT_NO_ANGLE_BRACKETS` validator is NOT applied to the other user-supplied text fields across the app. Each one renders in the UI somewhere and benefits from the same cosmetic/data-hygiene guard.

Verified on staging: `POST /auth/signup` with `name="<img src=x>"` → 201 Created.

## Environment

- Environment: staging (`https://lemon-wave-0a1790b0f.6.azurestaticapps.net/`)
- Commit / version: `vee3bf1f`

## Affected schemas

- `auth_schemas.SignUpRequestSchema.name`
- `user_schemas.CreateUserRequestSchema.name`
- `user_schemas.UpdateUserRequestSchema.name`
- `bank_account_schemas.DepositRequestSchema.reason_code` (hmm — this is a code, not free text; keep as-is)
- `bank_account_schemas.DepositRequestSchema.description`
- `bank_account_schemas.WithdrawRequestSchema.description`
- `bank_account_schemas.ChangeStatusSchema.reason`
- `bank_account_schemas.CreateRecurringDepositSchema.source_description`
- `bank_account_schemas.UpdateRecurringDepositSchema.source_description`
- `payment_schemas.RecordPaymentRequestSchema.notes`
- `payment_schemas.RescheduleRequestSchema.reason`
- `payment_schemas.PauseRequestSchema.reason`
- `recurring_loan_schemas.CreateRecurringLoanSchema.description_template`
- `recurring_loan_schemas.UpdateRecurringLoanSchema.description_template`

## Expected / Actual / Fix

Same as prior two bugs — add the shared `PLAIN_TEXT_NO_ANGLE_BRACKETS` validator to each listed field. No UX impact (these values have no legitimate reason to contain HTML tags). React already escapes on render so this is data hygiene.

## Impact and workaround

Low. Same shape as iter-21 and iter-28 — the output looks ugly in the UI (line-wrapping `<img src=x>` across headings) but there's no XSS. Workaround: edit the offending value after the fix lands.

## Related

- Parent bugs (all fixed): `2026-04-17-loan-description-allows-html-characters.md`, `2026-04-17-savings-text-fields-allow-html.md`.
- Shared validator: `backend/app/schemas/text_validators.py`.

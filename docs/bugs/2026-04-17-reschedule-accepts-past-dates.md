---
id: 2026-04-17-reschedule-accepts-past-dates
title: Reschedule Payment accepts arbitrary past dates (no server-side validation)
status: open
severity: high
area: backend
reported_by: claude
reported_at: 2026-04-17
---

## Summary

The reschedule-payment endpoint accepts any date, including dates years in the past. A creditor (or anyone posting a crafted request) can set a scheduled payment's `due_date` to `2020-01-01` and the backend stores it unchanged. No validation, no rejection, no audit warning. This corrupts the payment schedule and turns "reschedule" into an arbitrary-date-overwrite.

## Environment

- Environment: staging (`https://lemon-wave-0a1790b0f.6.azurestaticapps.net/`)
- API: `https://lendq-api-staging.wittyglacier-a7ff8abf.eastus2.azurecontainerapps.io/api/v1`
- Commit / version: `vf4649f` (UI footer)
- User role: Creditor (`creditor@lendq.local`) on loan `2528d433-…`

## Steps to reproduce

1. Sign in as `creditor@lendq.local`.
2. Open any active loan's detail page.
3. Click **Reschedule** on a `SCHEDULED` payment row.
4. Enter a date far in the past (e.g. `2020-01-01`).
5. Click **Reschedule**.

Or via API directly:

```
POST /api/v1/payments/<id>/reschedule
{ "new_date": "2020-01-01" }
→ 200 OK
```

## Expected behavior

The backend should reject any `new_date` that falls before today (and ideally before the loan's `start_date`). A sensible response:

```
422 { "code": "VALIDATION_ERROR", "message": "New payment date cannot be in the past" }
```

The UI should mirror this client-side, but server-side is the source of truth.

## Actual behavior

Verified end-to-end on staging: a SCHEDULED payment originally due `2026-06-16` was rescheduled to `2020-01-01` and the change persisted. Read-back:

```
GET /api/v1/loans/.../schedule
[
  { "due_date": "2020-01-01", "status": "RESCHEDULED", "original_due_date": "2026-06-16" },
  { "due_date": "2026-03-18", "status": "PAID", ... },
  ...
]
```

## Root cause analysis

`backend/app/schemas/payment_schemas.py:23-25`:

```python
class RescheduleRequestSchema(Schema):
    new_date = fields.Date(required=True)
    reason = fields.String(validate=validate.Length(max=500))
```

No validator on `new_date`.

`backend/app/services/payment_service.py:114-166` (`reschedule_payment`) accepts the payload without checking the date's relationship to `today` or the parent loan's `start_date`.

## Suggested fix

Reject `new_date` < today at the service layer (preferred: has access to the payment's loan context for any future cross-check). Also add a sanity upper bound (e.g. within 10 years of today) to block obvious typos like `20260-…`.

Sketch:

```python
from datetime import date
...
if data["new_date"] < date.today():
    raise ValidationError("New payment date cannot be in the past")
```

Schema-level validation is fine for a pure day-comparison, but the service layer is where the rest of the business rules already live.

## Impact and workaround

High. Data-integrity: the schedule becomes a set of non-chronological dates that break every downstream calculation (next-due summary, overdue detection, notifications). No workaround other than manually setting `due_date` and `status` back via a DB admin.

On staging, the loan `2528d433-8514-4110-a8ee-0c60245a7ead` currently has one corrupt row (`2020-01-01`) that should be cleaned up after the fix is deployed.

## Related

- Files: `backend/app/services/payment_service.py:114-166`, `backend/app/schemas/payment_schemas.py:23`
- User guide: [`docs/user-guide/05-payments.md#reschedule-a-payment`](../user-guide/05-payments.md#reschedule-a-payment)

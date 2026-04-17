---
id: 2026-04-17-record-payment-accepts-future-paid-date
title: Record Payment accepts future paid_date (no server-side upper bound)
status: open
severity: medium
area: backend
reported_by: claude
reported_at: 2026-04-17
---

## Summary

`POST /api/v1/loans/:id/payments` accepts any `paid_date`, including dates decades in the future. A `paid_date=2099-01-01` is obviously nonsense — you can't have received money on a date that hasn't happened — but the backend records it and the UI then displays it as a real payment event. Complements the past-date fixes from this session: this is the upper-bound counterpart.

## Environment

- Environment: staging (`https://lemon-wave-0a1790b0f.6.azurestaticapps.net/`)
- Commit / version: `v2308711`
- User role: Creditor (`creditor@lendq.local`)

## Steps to reproduce

```
POST /api/v1/loans/2528d433-…/payments
Headers: { Idempotency-Key: <any new key> }
{ "amount": 10, "paid_date": "2099-01-01" }
→ 201 { "message": "Payment recorded" }
```

Confirmed on staging.

## Expected behavior

```
422 { "code": "VALIDATION_ERROR", "message": "Paid date cannot be in the future" }
```

A payment is a record of money that has already moved; future dates have no meaning and corrupt the audit trail.

## Actual behavior

Accepted. Now a payment is attached to the loan's pending row with a paid_date stamped 73 years from now.

## Root cause analysis

- `backend/app/schemas/payment_schemas.py:19` — `paid_date = fields.Date(required=True)` with no validator.
- `backend/app/services/payment_service.py:record_payment` has an `amount <= 0` guard but no `paid_date > today()` guard.

Mirror of the past-date pattern cleaned up in iters 12, 14, 15, 16, 17. Worth extending the shared helper rather than hand-writing another guard.

## Suggested fix

Add a `reject_future_date` companion to `reject_past_date` in `backend/app/services/date_validators.py`, then call it from `record_payment`:

```python
from app.services.date_validators import reject_future_date
...
reject_future_date(data["paid_date"], field_label="Paid date")
```

## Impact and workaround

Medium. No immediate data-integrity corruption — the amount applies correctly to pending rows — but the displayed paid-on date is garbage, the audit trail becomes untrustworthy, and aggregations over time (e.g. "payments this month") pick up 2099-stamped rows forever.

## Related

- Past-date session fixes: the five bug files from iters 12, 14, 15, 16, 17.
- File: `backend/app/services/payment_service.py:record_payment`

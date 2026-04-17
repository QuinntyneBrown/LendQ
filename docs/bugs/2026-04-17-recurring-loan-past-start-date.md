---
id: 2026-04-17-recurring-loan-past-start-date
title: Recurring loan template accepts arbitrary past start_date (4th past-date validation gap)
status: fixed
severity: high
area: backend
reported_by: claude
reported_at: 2026-04-17
fixed_at: 2026-04-17
fixed_in: backend/app/services/recurring_loan_service.py (`date.today()` guard in create_recurring_loan)
---

## Summary

POST `/api/v1/loans/recurring` accepts any `start_date`. Systematic scan of `fields.Date` schemas surfaced this as the fourth instance of the past-date pattern, after reschedule (fixed iter 12), create loan (fixed iter 14), and savings deadline (fixed iter 15). Setting a recurring template to `start_date=2010-01-01` creates an active generator whose `next_generation_at` calculation operates from a ten-year-old anchor date — the backend may then attempt catch-up generations for every missed cycle, spawning potentially dozens of retroactive loans.

## Environment

- Environment: staging (`https://lemon-wave-0a1790b0f.6.azurestaticapps.net/`)
- Commit / version: `v86f750b`
- User role: Creditor (`creditor@lendq.local`)

## Steps to reproduce

```
POST /api/v1/loans/recurring
{
  "borrower_id": "<any borrower>",
  "description_template": "Past audit recurring",
  "principal_amount": 100,
  "interest_rate_percent": 0,
  "repayment_frequency": "MONTHLY",
  "installment_count": 3,
  "recurrence_interval": "MONTHLY",
  "start_date": "2010-01-01"
}
→ 201 Created (template id `5a2ff877-8065-40c3-a02a-5ac67d35f39a`)
```

Confirmed on staging. The test template was subsequently cancelled via `POST /loans/recurring/<id>/cancel` to prevent it from running catch-up generations.

## Expected behavior

Like the other three past-date fixes:

```
422 { "code": "VALIDATION_ERROR", "message": "Start date cannot be in the past" }
```

## Actual behavior

Template is created with `status=ACTIVE` and `next_generation_at` is computed from the far-past anchor. Depending on the scheduler's catch-up logic, every missed cycle could spawn a generation — a recurring MONTHLY template back-dated to 2010 represents ~180 missed cycles.

## Root cause analysis

Same pattern as the prior three past-date bugs:

- `backend/app/schemas/recurring_loan_schemas.py:49` — `start_date = fields.Date(required=True)` with no validator.
- `backend/app/services/recurring_loan_service.py` — `create_recurring_loan` does not guard against past dates.

## Suggested fix

Add the familiar guard in the service's create path:

```python
if data["start_date"] < date.today():
    raise ValidationError("Start date cannot be in the past")
```

Longer-term, consider a shared `validate_future_or_today(value)` helper so all four services can use the same function instead of four hand-written copies.

## Impact and workaround

High. Creating a back-dated recurring template could cascade into many historical fake loans if the scheduler's next_generation_at catch-up fires. The audit template was cancelled as mitigation; no catch-up was observed in the ~60 seconds between creation and cancellation.

## Related

- Sibling bugs: `2026-04-17-reschedule-accepts-past-dates.md` (fixed), `2026-04-17-create-loan-accepts-past-start-date.md` (fixed), `2026-04-17-savings-goal-accepts-past-deadline.md` (fixed).
- Also observed during this audit: bank-account `CreateRecurringDepositSchema.start_date` (`backend/app/schemas/bank_account_schemas.py:101`) has the same shape and is probably vulnerable — deferred to a separate investigation.
- File: `backend/app/services/recurring_loan_service.py`

---
id: 2026-04-17-create-loan-accepts-past-start-date
title: Create Loan accepts arbitrary past start dates (contradicts user guide and generates invalid schedules)
status: fixed
severity: high
area: backend
reported_by: claude
reported_at: 2026-04-17
fixed_at: 2026-04-17
fixed_in: backend/app/services/loan_service.py (`date.today()` guard in create_loan)
---

## Summary

POST `/api/v1/loans` accepts any `start_date`, including dates far in the past. The user guide explicitly says the start date "cannot be in the past for a new loan", but the backend has no validator enforcing that. Creating a loan dated years ago silently generates a schedule full of already-overdue payments and corrupts dashboard/summary metrics.

## Environment

- Environment: staging (`https://lemon-wave-0a1790b0f.6.azurestaticapps.net/`)
- Commit / version: `v048fbaa`
- User role: Creditor (`creditor@lendq.local`)

## Steps to reproduce

Via API:

```
POST /api/v1/loans
{
  "borrower_id": "<any valid user id>",
  "description": "Past-date loan audit",
  "principal": 100,
  "interest_rate": 0,
  "repayment_frequency": "MONTHLY",
  "start_date": "2010-01-01",
  "num_payments": 3
}
→ 201 Created
```

Confirmed end-to-end on staging: loan `2b75d867-9629-412e-bbc8-fde1894aec17` exists with `start_date=2010-01-01`.

## Expected behavior

Per [`docs/user-guide/04-loans.md#validation`](../user-guide/04-loans.md):

> **Start Date** cannot be in the past for a new loan.

The API should return `422` with `{ "code": "VALIDATION_ERROR", "message": "Start date cannot be in the past" }`.

## Actual behavior

Loan is created. All generated payments on the schedule are dated in the past. Dashboard "Overdue" counter inflates immediately; activity feed shows a "new loan" for a loan that allegedly started 16 years ago.

## Root cause analysis

- `backend/app/schemas/loan_schemas.py` — `LoanCreateSchema` has `fields.Date(required=True)` on `start_date` with no validator.
- `backend/app/services/loan_service.py` — `create_loan` does not check the date either.

Parallels `2026-04-17-reschedule-accepts-past-dates`, which was fixed at the service layer with `date.today()` comparison. Same treatment needed here.

## Suggested fix

Add a guard in `LoanService.create_loan`:

```python
if data["start_date"] < date.today():
    raise ValidationError("Start date cannot be in the past")
```

Hit before any persistence so a rejected request leaves no partial state.

## Impact and workaround

High. Creates immediately-corrupt data (dashboard metrics, overdue counters, activity feed). No user-side workaround once a back-dated loan exists — LendQ does not support loan deletion by design.

Cleanup for the test loan left from this audit (`2b75d867-9629-412e-bbc8-fde1894aec17`) requires a direct DB update or an admin endpoint that does not yet exist.

## Related

- Sibling bug: `docs/bugs/2026-04-17-reschedule-accepts-past-dates.md`
- Files: `backend/app/services/loan_service.py`, `backend/app/schemas/loan_schemas.py`
- Guide: `docs/user-guide/04-loans.md#validation`

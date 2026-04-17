---
id: 2026-04-17-interest-rate-no-bounds
title: Loan creation has no bounds on interest_rate — negative accepted, huge values crash
status: fixed
severity: high
area: backend
reported_by: claude
reported_at: 2026-04-17
fixed_at: 2026-04-17
fixed_in: backend/app/schemas/loan_schemas.py + recurring_loan_schemas.py (validate.Range(min=0, max=100) on all interest_rate fields)
---

## Summary

`POST /api/v1/loans` applies no range check on `interest_rate`. Two failure modes in the same probe:

1. **`interest_rate = -10`** → **201 Created**. Loan persists with a negative rate, effectively meaning the creditor pays interest to the borrower.
2. **`interest_rate = 99999`** → **500 Internal Server Error**. An unbounded rate crashes the schedule-generation arithmetic.

The user guide explicitly promises the field is in range `[0, 100]` per `docs/user-guide/04-loans.md#validation`, but that contract isn't enforced at the schema or service layer.

## Environment

- Environment: staging (`https://lemon-wave-0a1790b0f.6.azurestaticapps.net/`)
- Commit / version: `v3edd95b`
- User role: Creditor (`creditor@lendq.local`)

## Steps to reproduce

Negative rate:

```
POST /api/v1/loans
{ borrower_id:"...", description:"…", principal:100,
  interest_rate:-10, repayment_frequency:"MONTHLY",
  start_date:"2026-12-01", num_payments:3 }
→ 201 Created
```

Huge rate:

```
POST /api/v1/loans
{ ..., interest_rate: 99999, ... }
→ 500 { "code": "INTERNAL_ERROR", "message": "An unexpected error occurred" }
```

## Expected behavior

Both requests should return `422 VALIDATION_ERROR` with an explanatory message pointing the user at the allowed range.

## Actual behavior

Negative rates silently accepted. Extreme rates crash the server.

## Root cause analysis

- `backend/app/schemas/loan_schemas.py:41` — `interest_rate = fields.Decimal(as_string=True)` has no `validate.Range`.
- `backend/app/services/loan_service.py:create_loan` checks `principal > 0` but has no interest-rate clamp.
- The 500 almost certainly comes from `ScheduleService` computing payment amounts with a rate so large that amortization math overflows Decimal precision or exceeds the column width.

## Suggested fix

Add a schema-level `validate=validate.Range(min=Decimal("0"), max=Decimal("100"))` to `LoanCreateSchema.interest_rate`. The same validator should appear on `RecurringLoanCreateSchema.interest_rate_percent` (untested here but the same shape).

Service-layer guard is not strictly needed on top of the schema, but adding a defensive `raise ValidationError(...)` keeps the failure path consistent with the other guards we already have (principal > 0, start_date >= today).

## Impact and workaround

High. The negative-rate branch produces plausible-looking but incorrect loans that flow through the rest of the app as if valid — the schedule calculates negative "interest" amounts which compound into nonsense totals. The 500 branch surfaces directly to any user who mis-types a rate.

No user-facing workaround. Fix has to land in the schema or service.

## Related

- File: `backend/app/schemas/loan_schemas.py`
- Guide: `docs/user-guide/04-loans.md#validation`
- Sibling (unchecked): `backend/app/schemas/recurring_loan_schemas.py:interest_rate_percent`

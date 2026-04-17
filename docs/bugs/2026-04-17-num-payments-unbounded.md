---
id: 2026-04-17-num-payments-unbounded
title: Loan creation has no upper bound on num_payments — huge values 500
status: fixed
severity: medium
area: backend
reported_by: claude
reported_at: 2026-04-17
fixed_at: 2026-04-17
fixed_in: backend/app/schemas/loan_schemas.py + recurring_loan_schemas.py (`max=1000` on num_payments / installment_count / max_occurrences)
---

## Summary

`POST /api/v1/loans` requires `num_payments >= 1` at the schema layer but sets no upper bound. `num_payments=100000` triggers a 500 Internal Server Error — the schedule-generation code either runs out of memory, hits a DB write timeout, or creates tens of thousands of payment rows before failing partway through. Same flavour as the interest-rate crash fixed in iter 19.

## Environment

- Environment: staging (`https://lemon-wave-0a1790b0f.6.azurestaticapps.net/`)
- Commit / version: `v7dbb754`
- User role: Creditor (`creditor@lendq.local`)

## Steps to reproduce

```
POST /api/v1/loans
{
  "borrower_id": "...",
  "description": "num_payments audit",
  "principal": 100,
  "interest_rate": 0,
  "repayment_frequency": "MONTHLY",
  "start_date": "2026-12-01",
  "num_payments": 100000
}
→ 500 INTERNAL_ERROR
```

## Expected behavior

422 with a clear message pointing at a sane upper bound. A practical ceiling for a private-lending tool is well under 1000 installments (even weekly over 10 years is ~520).

## Actual behavior

500. Depending on where the crash happens, the loan row or some payment rows may be partially persisted before the transaction rolls back — a risk worth eliminating with an up-front validator.

## Root cause analysis

`backend/app/schemas/loan_schemas.py:46`:

```python
num_payments = fields.Integer(required=True, validate=validate.Range(min=1))
```

No `max`. `ScheduleService.generate_schedule` (or equivalent) loops `num_payments` times creating Payment rows, crashing somewhere past a few thousand.

## Suggested fix

Add `max=1000` (or similar) to the range validator:

```python
num_payments = fields.Integer(
    required=True,
    validate=validate.Range(min=1, max=1000),
)
```

1000 monthly payments = ~83 years — clearly more than any private loan should ever need.

## Impact and workaround

Medium. No practical user hits this, but any error path that crashes with 500 is exploitable as a noisy DoS if public signup is enabled. Fix is a one-line schema change.

## Related

- Sibling: `2026-04-17-interest-rate-no-bounds.md` — same shape, fixed the same way (schema-level bound).
- File: `backend/app/schemas/loan_schemas.py:46`
- Install count is also present in recurring-loan schema — worth applying the same bound there.

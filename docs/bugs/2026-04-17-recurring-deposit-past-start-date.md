---
id: 2026-04-17-recurring-deposit-past-start-date
title: Bank-account recurring deposit accepts past start_date (5th and final past-date gap)
status: open
severity: high
area: backend
reported_by: claude
reported_at: 2026-04-17
---

## Summary

`POST /api/v1/accounts/<id>/recurring-deposits` accepts any `start_date`. With `start_date=2010-01-01` the created deposit has `next_execution_at=2010-01-01T09:00:00` — the scheduler's next tick would attempt to run the deposit immediately and potentially catch up on ~180 missed cycles. Fifth and (probably) last instance of the past-date validation pattern that was fixed four times already this audit session.

## Environment

- Environment: staging (`https://lemon-wave-0a1790b0f.6.azurestaticapps.net/`)
- Commit / version: `vd2481ee`
- User: `creditor@family.com` (seeded with an ACTIVE bank account, balance $10,000)

## Steps to reproduce

```
POST /api/v1/accounts/a42e141b-…/recurring-deposits
{
  "amount": 50,
  "source_description": "Past-date audit",
  "frequency": "MONTHLY",
  "start_date": "2010-01-01"
}
→ 201
{
  "id": "b586ed76-…",
  "next_execution_at": "2010-01-01T09:00:00",
  ...
}
```

Cleaned up via `DELETE /accounts/<id>/recurring-deposits/<id>`.

## Expected behavior

```
422 { "code": "VALIDATION_ERROR", "message": "Start date cannot be in the past" }
```

## Actual behavior

Deposit persisted with a 2010 anchor for `next_execution_at`. Scheduler behavior past that anchor was not observed — the audit cancelled the row before any tick fired.

## Root cause analysis

- `backend/app/schemas/bank_account_schemas.py:101` — `start_date = fields.Date(required=True)` with no validator.
- `backend/app/services/bank_account_service.py` (or wherever the create lives) — no `date.today()` comparison.

Identical shape to the four past-date bugs already fixed this session:

1. `2026-04-17-reschedule-accepts-past-dates.md` (fixed iter 12)
2. `2026-04-17-create-loan-accepts-past-start-date.md` (fixed iter 14)
3. `2026-04-17-savings-goal-accepts-past-deadline.md` (fixed iter 15)
4. `2026-04-17-recurring-loan-past-start-date.md` (fixed iter 16)

## Suggested fix

Same shape as the prior four:

```python
if data["start_date"] < date.today():
    raise ValidationError("Start date cannot be in the past")
```

Hit at the top of the recurring-deposit create service method, before any DB write.

Given this is the fifth hand-rolled copy of the same guard, the session's suggested follow-up — a shared `validate_future_or_today` helper — is now concretely worthwhile.

## Impact and workaround

High. A back-dated deposit could trigger cascading catch-up deposits on the next scheduler tick, corrupting the user's ledger. No workaround other than cancelling the entry before the scheduler fires.

## Related

- File: `backend/app/services/bank_account_service.py` (create_recurring_deposit)
- Siblings: see list above

---
id: 2026-04-17-savings-goal-accepts-past-deadline
title: Savings goal creation accepts arbitrary past deadlines
status: fixed
severity: medium
area: backend
reported_by: claude
reported_at: 2026-04-17
fixed_at: 2026-04-17
fixed_in: backend/app/services/savings_goal_service.py (`date.today()` guard in create_goal)
---

## Summary

POST `/api/v1/savings` accepts any `deadline`, including dates years in the past. A savings goal gets created `IN_PROGRESS` with an impossible deadline — the UI's overdue check then flips it to "Overdue" immediately. Third instance of the same past-date pattern already fixed for reschedule (iter 12) and loan start_date (iter 14).

## Environment

- Environment: staging (`https://lemon-wave-0a1790b0f.6.azurestaticapps.net/`)
- Commit / version: `v048fbaa`
- User role: Borrower (`borrower1@lendq.local`)

## Steps to reproduce

```
POST /api/v1/savings
{
  "name": "Past-date goal audit",
  "target_amount": 500,
  "deadline": "2010-01-01"
}
→ 201 { "deadline": "2010-01-01", "status": "IN_PROGRESS", ... }
```

Confirmed on staging: goal `49448a0e-96a5-4e06-9663-5d41696069b3` was created with a 2010 deadline and had to be cancelled as cleanup.

## Expected behavior

The backend should reject deadlines earlier than today:

```
422 { "code": "VALIDATION_ERROR", "message": "Deadline cannot be in the past" }
```

The user guide doesn't call this out explicitly, but the product intent (a "savings goal" is a *future* target) is obvious.

## Actual behavior

Accepted. The goal is `IN_PROGRESS`, the list page's overdue check (see `2026-04-17-savings-deadline-timezone-off-by-one`) flips it to "Overdue" immediately, and the user has a nonsense goal in their list.

## Root cause analysis

- `backend/app/schemas/savings_schemas.py` (or equivalent): no validator on `deadline`.
- `backend/app/services/savings_goal_service.py` (or equivalent): no `date.today()` check in create.

Same pattern as reschedule (`PaymentService.reschedule_payment`) and create loan (`LoanService.create_loan`) — both previously fixed. This is the third instance.

## Suggested fix

Add a guard mirroring the existing two:

```python
if data.get("deadline") and data["deadline"] < date.today():
    raise ValidationError("Deadline cannot be in the past")
```

Deadline is optional on savings goals, so guard with `if data.get("deadline")`.

## Impact and workaround

Medium. No direct data corruption (the goal is a standalone entity), but pollutes the user's savings list with visibly broken entries and inflates "Overdue" counts if the dashboard ever aggregates them.

Workaround: cancel the goal via POST `/api/v1/savings/<id>/cancel`.

## Related

- Sibling bugs: `2026-04-17-reschedule-accepts-past-dates.md`, `2026-04-17-create-loan-accepts-past-start-date.md`
- Files: `backend/app/services/savings_goal_service.py`, `backend/app/schemas/savings_schemas.py`

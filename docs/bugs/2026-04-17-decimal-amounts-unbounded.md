---
id: 2026-04-17-decimal-amounts-unbounded
title: Money amounts have no upper bound — huge principal 500s, huge payments slip through
status: fixed
severity: medium
area: backend
reported_by: claude
reported_at: 2026-04-17
fixed_at: 2026-04-17
fixed_in: backend/app/schemas/loan_schemas.py (shared MONEY_MAX = 999,999,999.99) + payment_schemas.py + savings_goal_schemas.py + bank_account_schemas.py + recurring_loan_schemas.py
---

## Summary

Money fields in LendQ (`loan.principal`, `payment.amount`, deposit/withdraw, savings target + contributions) all pass `fields.Decimal(...)` with no `validate.Range(max=...)`. Two probes with 27-digit amounts:

- `POST /loans` with `principal=999999999999999999999999999.99` → **500 INTERNAL_ERROR** (DB column exceeded).
- `POST /loans/:id/payments` with `amount=999999999999999999999999999.99` → **201 Created**. The service's per-row clamp (`amount_paid = amount_due`) absorbs the excess silently — loan flips to PAID_OFF regardless of input insanity.

Same class as iters 19 (interest_rate) / 20 (num_payments) / 25 (email): unbounded numeric input causing either a 500 or silent acceptance of nonsense.

## Environment

- Environment: staging (`https://lemon-wave-0a1790b0f.6.azurestaticapps.net/`)
- Commit / version: `v69bb3f5`
- User role: Creditor

## Steps to reproduce

Principal crash:

```
POST /api/v1/loans
{ ..., "principal": "999999999999999999999999999.99", ... }
→ 500 INTERNAL_ERROR
```

Payment overflow accepted:

```
POST /api/v1/loans/<id>/payments
Idempotency-Key: unique
{ "amount": "999999999999999999999999999.99", "paid_date": "2026-04-17" }
→ 201 Created  (loan flipped to PAID_OFF)
```

## Expected behavior

Both should return 422 with a clear range message. A private-lending platform's legitimate upper bound is at most ten million dollars per transaction; 999,999,999.99 (billion-range) is a safe headroom ceiling.

## Actual behavior

- Principal: server error (leaks stack to client via request_id).
- Payment amount: silently clamped per-row so the overall loan state still looks "valid" — but an attacker posting amount=10^27 exercises a code path that was never meant to handle that input.

## Root cause analysis

- `backend/app/schemas/loan_schemas.py` — `principal = fields.Decimal(required=True, as_string=True)` has no `validate.Range`.
- `backend/app/schemas/payment_schemas.py:18` — `amount = fields.Decimal(required=True, as_string=True)` has no `validate.Range`.
- Other monetary fields (deposits, withdrawals, savings contributions, savings target) DO have `validate.Range(min=0.01)` but no `max`.

## Suggested fix

Add `validate.Range(max=Decimal("999999999.99"))` (plus the existing min where present) to every monetary Decimal field:

- `loan_schemas.CreateLoanRequestSchema.principal` + `UpdateLoanRequestSchema.principal`
- `payment_schemas.RecordPaymentRequestSchema.amount`
- `recurring_loan_schemas.*.principal_amount`
- `savings_goal_schemas.*.target_amount` + contribute/release amounts
- `bank_account_schemas.DepositRequestSchema.amount` + WithdrawRequestSchema.amount + CreateRecurringDepositSchema.amount

## Impact and workaround

Medium. No live data corruption observed (the loan flipping to PAID_OFF is technically "correct" given the input), but the 500 on principal is a real crash and the absence of any max lets an attacker test code paths the developers never considered.

## Related

- Sibling bugs in this session: interest_rate (iter 19), num_payments (iter 20), email length (iter 25).
- Files: `backend/app/schemas/loan_schemas.py`, `payment_schemas.py`, others as listed above.

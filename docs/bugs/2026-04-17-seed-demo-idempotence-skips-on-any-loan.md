---
id: 2026-04-17-seed-demo-idempotence-skips-on-any-loan
title: Demo seed skips all loan creation when any loan exists (user-created loans block seeding)
status: open
severity: high
area: backend
reported_by: claude
reported_at: 2026-04-17
---

## Summary

`seed_demo()` short-circuits loan creation as soon as `Loan.query.count() > 0`. A single user-created loan — even one unrelated to the demo fixture — is enough to make the seed skip the entire demo-loan block on every subsequent startup. On staging this showed up immediately after `BUG 2026-04-17-staging-demo-seed-missing-loans` was fixed at the workflow level: the seed now runs, but it still does nothing because the audit itself created one real loan, pushing `Loan.query.count()` above zero.

## Environment

- Environment: staging (`https://lemon-wave-0a1790b0f.6.azurestaticapps.net/`) — exposed by the fix from `2026-04-17-staging-demo-seed-missing-loans`
- Commit / version: after `effa998` (the workflow fix) rolled out
- User role: observed as `creditor@lendq.local`, confirmed affecting every demo account

## Steps to reproduce

1. Fresh database: run `seed_demo()`. All demo loans appear — good.
2. Create any loan through the UI or API (for example, a test loan from Jane Creditor to Bob Borrower).
3. Clear just the demo loans' counterpart records (simulating a partial cleanup), or do nothing and redeploy.
4. Restart the API with `SEED_ON_STARTUP=demo`.
5. `seed_demo()` sees `Loan.query.count() > 0`, logs `Demo loans already exist, skipping`, and returns without re-populating anything.

## Expected behavior

The demo seed should be idempotent **per-fixture**, not per-table. For each demo loan it intends to create, it should check whether a loan with the same (creditor, borrower, description, start_date) already exists and skip only that record. Existing user-created loans must not block demo loans from being seeded.

## Actual behavior

`backend/app/seed.py:168`:

```python
# Only seed loans if none exist
if Loan.query.count() > 0:
    print("  Demo loans already exist, skipping")
    print("Demo seed complete.")
    return
```

On staging after the workflow fix deployed, I observed:

```json
GET /api/v1/loans (as creditor@lendq.local)
{
  "items": [
    {
      "description": "Loop-audit test loan",   // created manually during iter-2
      "creditor_name": "Jane Creditor",
      "borrower_name": "Bob Borrower",
      "principal": "1000.00",
      ...
    }
  ],
  "total": 1
}
```

The fixture loans ("Personal loan for home improvement", "Emergency fund loan", etc.) are absent.

## Root cause analysis

`backend/app/seed.py:167-171` uses the existence of _any_ loan row as the idempotence marker. This is cheap but wrong: it conflates "someone once ran the demo seed" with "there are loans in the database." Any real loan — test, manual creation, or leftover from a prior fixture — poisons the check.

Compare to the users, roles, and bank-account branches in the same file, which all use per-record `filter_by(...).first()` checks and are correctly idempotent.

## Suggested fix

Rewrite the loan/payment section of `seed_demo()` to upsert by identity. For each fixture loan, query for `(creditor_id, borrower_id, description)` (or a synthetic `seed_key` column if we add one) and create only when missing. Same treatment for the payments attached to each loan — keyed by `(loan_id, due_date)`.

Minimal change that keeps the schema alone:

```python
def _ensure_loan(creditor, borrower, description, **attrs):
    existing = Loan.query.filter_by(
        creditor_id=creditor.id,
        borrower_id=borrower.id,
        description=description,
    ).first()
    if existing:
        return existing, False
    loan = Loan(
        creditor_id=creditor.id,
        borrower_id=borrower.id,
        description=description,
        **attrs,
    )
    db.session.add(loan)
    db.session.flush()
    return loan, True
```

Then build each fixture loan through `_ensure_loan(...)` and only create its payment schedule when the boolean `created` flag is true.

## Impact and workaround

High. The entire point of a demo environment is "one deploy, ready to click through the user guide." This bug makes the demo seed useless after the very first user interaction, defeating the purpose of `SEED_ON_STARTUP=demo`.

Workaround: wipe all loans before re-running the seed (`DELETE FROM loans;`). Not something users should do on a shared staging environment.

## Related

- Upstream bug: `docs/bugs/2026-04-17-staging-demo-seed-missing-loans.md` (fixed at the workflow level — this bug was revealed by that fix)
- File: `backend/app/seed.py:167-171`

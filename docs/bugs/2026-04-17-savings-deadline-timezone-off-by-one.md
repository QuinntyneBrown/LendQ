---
id: 2026-04-17-savings-deadline-timezone-off-by-one
title: Savings goal deadline still renders one day early (continuation of formatDate timezone bug)
status: fixed
severity: high
area: frontend
reported_by: claude
reported_at: 2026-04-17
fixed_at: 2026-04-17
fixed_in: frontend/src/utils/format.ts (added parseDateOnly helper) + SavingsGoalListPage.tsx + SavingsGoalDetailPage.tsx (switched to parseDateOnly / formatDate)
---

## Summary

The earlier fix for `2026-04-17-formatdate-timezone-off-by-one` swapped `new Date(d)` for `parseISO(d)` in `utils/format.ts`. The savings list and detail pages bypass that helper entirely — each has its own `new Date(goal.deadline)` call, so the same UTC-parse-then-shift bug still renders deadlines one day early.

## Environment

- Environment: staging (`https://lemon-wave-0a1790b0f.6.azurestaticapps.net/`)
- Commit / version: `va317e8a` (post-timezone-fix)
- Browser: `America/Toronto` (UTC-4)
- User role: Borrower (`borrower1@lendq.local`)

## Steps to reproduce

1. Sign in as `borrower1@lendq.local` / `password123`.
2. Open `/savings` and click **Create New Goal**.
3. Fill the form:
   - Goal Name: `Emergency Fund`
   - Target Amount: `1000`
   - Deadline: `2026-12-31`
4. Click **Create Goal**.
5. The new goal card shows **"Deadline: Dec 30, 2026"** — off by one day.

## Expected behavior

The deadline in the UI should match the deadline in the API: `2026-12-31` → **Dec 31, 2026**.

## Actual behavior

- API: `GET /api/v1/savings` returns `{"deadline": "2026-12-31", ...}` — correct.
- UI card: `Deadline: Dec 30, 2026` — wrong.

Screenshot: `docs/audit-artifacts/iter7-savings-after.png`.

## Root cause analysis

The savings pages parse deadlines in four places with a raw `new Date(...)`:

- `frontend/src/savings/SavingsGoalListPage.tsx:24` — overdue check
- `frontend/src/savings/SavingsGoalListPage.tsx:34` — `formatDeadline` helper
- `frontend/src/savings/SavingsGoalDetailPage.tsx:25` — overdue check
- `frontend/src/savings/SavingsGoalDetailPage.tsx:37` — `getDaysLeft` helper

Each of these constructs a `Date` from a `"YYYY-MM-DD"` string, which JS parses as UTC midnight. In any timezone west of UTC the local calendar day is the day before.

The fix in `utils/format.ts` only affected the `formatDate` and `relativeTime` helpers — anything that bypasses them still carries the bug.

## Suggested fix

Replace every `new Date(dateOnlyString)` in these files with `parseISO(dateOnlyString)` from `date-fns`, consistent with the earlier fix to `utils/format.ts`.

A longer-term fix would be to expose a shared helper (e.g. `parseDateOnly(d: string): Date`) in `utils/format.ts` so future date-handling code has an obvious correct primitive to reach for. For this patch, inlining `parseISO` is the minimum change.

## Impact and workaround

High. Every savings goal with a deadline shows the wrong day to every North American user. Progress/overdue calculations also use the same skewed date, so goals may flip to `Overdue` a day early.

No workaround on the user side.

## Related

- Upstream fix: `docs/bugs/2026-04-17-formatdate-timezone-off-by-one.md` (fixed only `utils/format.ts`; savings files were missed)
- Files: `frontend/src/savings/SavingsGoalListPage.tsx`, `frontend/src/savings/SavingsGoalDetailPage.tsx`

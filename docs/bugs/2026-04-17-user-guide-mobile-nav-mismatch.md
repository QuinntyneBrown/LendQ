---
id: 2026-04-17-user-guide-mobile-nav-mismatch
title: User guide's mobile bottom-nav description doesn't match the design or the implementation
status: fixed
severity: low
area: docs
reported_by: claude
reported_at: 2026-04-17
fixed_at: 2026-04-17
fixed_in: docs/user-guide/03-navigation.md (Mobile section rewritten to match Home/Loans/Owed/Alerts/More design) + test_user_guide_sync.py pins the labels
---

## Summary

`docs/user-guide/03-navigation.md` says the mobile bottom-nav primary tabs are **Dashboard, My Loans, Borrowings, Savings, Notifications**. The actual rendered app, cross-referenced against the authoritative design in `docs/ui-design.pen` (frame `LlQAs`, "Mobile Bottom Tab Bar"), shows **Home, Loans, Owed, Alerts, More**. Savings is moved into the **More** menu.

Documentation drift — the design and code agree; only the guide is wrong.

## Environment

- Environment: staging (`https://lemon-wave-0a1790b0f.6.azurestaticapps.net/`)
- Commit / version: `v50f9b28`
- Viewport: 390 × 844 (iPhone-style)

## Steps to reproduce

1. Sign in as any user.
2. Resize the browser to ≤ 767 px.
3. Observe the bottom tab bar:
   - Icons: `layout-dashboard`, `banknote`, `hand-coins`, `bell`, `menu`
   - Labels: Home, Loans, Owed, Alerts, More

Then read `docs/user-guide/03-navigation.md`:

> Bottom navigation — five primary tabs always visible: Dashboard, My Loans, Borrowings, Savings, Notifications.
> More menu — a sixth button that reveals Recurring Loans, Account, Notifications, Settings, …

Both text and counts disagree with the shipped app.

## Expected behavior

The user guide should describe the design-and-implementation-agreed tabs: **Home, Loans, Owed, Alerts, More**, with Savings listed in the More menu.

## Actual behavior

Guide has a stale description that predates the nav redesign.

## Root cause analysis

Guide was written from an earlier spec that shipped "My Loans / Borrowings / Savings" as primary tabs. The design file and `frontend/src/layout/MobileBottomNav.tsx` moved on; the guide didn't.

## Suggested fix

Rewrite the "Mobile (< 768 px wide)" section of `docs/user-guide/03-navigation.md` to match:

- **Bottom navigation — five primary tabs:** Home, Loans, Owed, Alerts, More.
- **More menu** reveals: Savings, Recurring Loans, Account, Settings, and (for Admins) Users and Bank Accounts, plus Sign Out.

## Impact and workaround

Low — docs-only. A reader following the guide on mobile is briefly confused but functionality is the same.

## Related

- File: `docs/user-guide/03-navigation.md`
- Design: `docs/ui-design.pen` → frame `LlQAs` (Mobile Bottom Tab Bar)
- Code: `frontend/src/layout/MobileBottomNav.tsx`

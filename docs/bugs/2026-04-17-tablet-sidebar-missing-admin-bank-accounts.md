---
id: 2026-04-17-tablet-sidebar-missing-admin-bank-accounts
title: Tablet drawer omits the "Bank Accounts" admin link (desktop has it)
status: open
severity: low
area: frontend
reported_by: claude
reported_at: 2026-04-17
---

## Summary

`TabletSidebar` lists the same nav items as the desktop sidebar except for the **Bank Accounts** admin-only entry (`/admin/accounts`). An admin on a tablet-width viewport (768–1023 px) who opens the drawer has no in-UI way to navigate to that page.

## Environment

- Environment: staging (`https://lemon-wave-0a1790b0f.6.azurestaticapps.net/`)
- Commit / version: `va2fc619`
- Viewport: 900 × 700
- Signed in as Admin (`admin@lendq.local`)

## Steps to reproduce

1. Sign in as `admin@lendq.local`.
2. Resize the browser to 900 px wide.
3. Click the hamburger to open the drawer.
4. Compare the drawer's admin section against the desktop sidebar: **Bank Accounts** is missing.

## Expected behavior

The tablet drawer should include every nav entry the desktop sidebar does — tablet is just a layout variant, not a feature-gated surface.

## Actual behavior

`frontend/src/layout/TabletSidebar.tsx` renders:

- Dashboard
- My Loans
- Borrowings
- Recurring Loans
- Account
- Savings
- Users (admin-only)
- Notifications
- Settings

Compared to `DesktopSidebar.tsx`, the `Bank Accounts` (admin-only, `/admin/accounts`) entry is absent.

## Root cause analysis

`frontend/src/layout/TabletSidebar.tsx:74-80` renders the admin-Users entry but never adds a matching `Bank Accounts` entry. The file was forked from the desktop sidebar when admin bank accounts were added and never caught up.

## Suggested fix

Insert a second admin `NavItem` into `TabletSidebar.tsx`:

```tsx
{isAdmin && (
  <>
    <NavItem icon={Users} label="Users" href="/users" onClick={onClose} />
    <NavItem icon={Wallet} label="Bank Accounts" href="/admin/accounts" onClick={onClose} />
  </>
)}
```

(Or fold the duplicate nav-list into a shared `NAV_ITEMS` constant so both sidebars stay in sync going forward.)

## Impact and workaround

Low — admin on tablet. They can type `/admin/accounts` into the URL bar or switch to desktop. Sign Out and other auth actions are still available via the user-avatar dropdown in the header.

## Related

- Mobile `MobileBottomNav.tsx`: similar admin gating — check that it too surfaces Bank Accounts somewhere, ideally in the More menu.
- Files: `frontend/src/layout/TabletSidebar.tsx` vs `DesktopSidebar.tsx`.

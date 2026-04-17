---
id: 2026-04-17-bank-account-empty-state-unhelpful
title: Bank Account page shows a bare "No bank account found." message with no guidance for users without an account
status: fixed
severity: low
area: frontend
reported_by: claude
reported_at: 2026-04-17
fixed_at: 2026-04-17
fixed_in: frontend/src/bank-account/BankAccountPage.tsx (EmptyState with Wallet icon and user-guide phrasing)
---

## Summary

When a user visits `/account` and has no bank account provisioned, the page renders just the text **"No bank account found."** — no header, no icon, no action. The user guide advertises a richer affordance: "Request an account from your administrator". The actual implementation leaves the user at a dead end with no way to proceed and no guidance on what to do next.

## Environment

- Environment: staging (`https://lemon-wave-0a1790b0f.6.azurestaticapps.net/account`)
- Commit / version: `vebee51c`
- User role: Borrower (`borrower1@lendq.local`) — a demo account that the seed does **not** provision a bank account for.

## Steps to reproduce

1. Sign in as `borrower1@lendq.local` / `password123`.
2. Click **Account** in the sidebar (or navigate to `/account` directly).
3. Observe the content area: plain-text "No bank account found." and nothing else. No title, no icon, no action, no instructions.

## Expected behavior

Per [`docs/user-guide/07-bank-account.md`](../user-guide/07-bank-account.md):

> `NO_ACCOUNT` — no bank account provisioned. The Deposit/Withdraw buttons are replaced by **"Request an account from your administrator"**.

The empty state should follow the standard LendQ empty-state shape (icon, heading, body, optional action) and include copy that tells the user what to do next: contact an administrator.

## Actual behavior

`frontend/src/bank-account/BankAccountPage.tsx:167-173`:

```tsx
if (!account) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <p className="font-body text-text-secondary">No bank account found.</p>
    </div>
  );
}
```

One paragraph. No heading. No action.

## Root cause analysis

The page was written to handle the "loaded-successfully" case and treats the missing-account branch as a simple fallback. The user guide's description of this state was never wired up.

## Suggested fix

Replace the bare paragraph with an empty-state matching the rest of the app (LoanListPage, SavingsGoalListPage use a similar pattern):

```tsx
if (!account) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <Wallet className="h-10 w-10 text-text-muted" />
      <h3 className="font-heading text-xl font-semibold text-text-primary">
        No bank account yet
      </h3>
      <p className="font-body text-text-secondary max-w-sm">
        Request an account from your administrator to start depositing funds
        and funding savings goals.
      </p>
    </div>
  );
}
```

The heading and guidance text match the user guide. The icon mirrors the sidebar's Account entry for visual continuity.

## Impact and workaround

Low. A small set of users hit this (demo borrower accounts, and any production user who was provisioned without an account). No data or functionality is at risk — only UX and brand consistency.

## Related

- File: `frontend/src/bank-account/BankAccountPage.tsx:167-173`
- Guide: `docs/user-guide/07-bank-account.md` (Account status section)

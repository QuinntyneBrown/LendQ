---
id: 2026-04-17-add-funds-silently-disabled-without-account
title: "Add Funds dialog is silently disabled when the user has no bank account"
status: fixed
severity: medium
area: frontend
reported_by: claude
reported_at: 2026-04-17
fixed_at: 2026-04-17
fixed_in: frontend/src/savings/AddFundsDialog.tsx (no-account branch with Wallet icon + guidance)
---

## Summary

When a user opens the Add Funds dialog on a savings goal and they do not have a bank account, the **Add Funds** submit button is silently disabled regardless of what amount they type. There is no message, no error, no hint — the user fills in an amount, clicks a button that does nothing, and has no way to know why.

## Environment

- Environment: staging (`https://lemon-wave-0a1790b0f.6.azurestaticapps.net/`)
- Commit / version: `ve10b6d0` (UI footer)
- User role: Borrower (`borrower1@lendq.local`), who the demo seed does **not** provision a bank account for.

## Steps to reproduce

1. Sign in as `borrower1@lendq.local`.
2. Create a savings goal (or open the Emergency Fund created earlier).
3. Click **Add Funds**.
4. Enter any valid amount (e.g. `500`).
5. Observe the **Add Funds** button in the footer: still visibly disabled (pale primary color).
6. Hover / click → nothing happens. No toast, no inline error.

## Expected behavior

Per [`docs/user-guide/08-savings-goals.md#add-funds`](../user-guide/08-savings-goals.md#add-funds):

> Funds come from your Bank Account. If the bank account balance is insufficient, the dialog shows an inline error before submit.

And by analogy, if there is no bank account at all, the user should be told — ideally with the same "Request an account from your administrator" guidance used by the fix in `2026-04-17-bank-account-empty-state-unhelpful`.

## Actual behavior

The submit handler is gated by `disabled={contributeMutation.isPending || !accountId}` in `frontend/src/savings/AddFundsDialog.tsx:102`. `accountId = accountsData?.items?.[0]?.id ?? ""` — if the user has no accounts, this is an empty string, so the button stays disabled silently.

## Root cause analysis

`frontend/src/savings/AddFundsDialog.tsx:100-104`:

```tsx
<Button
  type="submit"
  onClick={handleSubmit(onSubmit)}
  isLoading={contributeMutation.isPending}
  disabled={contributeMutation.isPending || !accountId}
>
  Add Funds
</Button>
```

The dialog renders the same form regardless of whether the user has an account. It never tells them why the submit is inert.

## Suggested fix

When `!accountId`, replace the form content (or prepend a banner) with a short message identical to the empty state on `/account`: "Request an account from your administrator. You need a bank account to fund a savings goal." Also hide the amount input or disable it with an explicit description.

Concretely, gate the body of the dialog:

```tsx
{!accountId ? (
  <div className="flex flex-col items-center gap-3 text-center py-4">
    <Wallet className="h-8 w-8 text-text-muted" />
    <p className="font-body text-sm text-text-secondary">
      You need a bank account to fund a savings goal. Request an account from your administrator.
    </p>
  </div>
) : (
  // existing form content
)}
```

And keep the button disabled (or hide it) — but now the user understands why.

## Impact and workaround

Medium. Demo borrower accounts hit this every time. In production, any user who wasn't provisioned an account (or whose account is `CLOSED`) will experience the same dead-end.

Workaround: ask an admin to create the account, then retry.

## Related

- File: `frontend/src/savings/AddFundsDialog.tsx:100-104`
- Sister fix: `docs/bugs/2026-04-17-bank-account-empty-state-unhelpful.md` — similar pattern, fixed with `EmptyState`.
- Guide: `docs/user-guide/08-savings-goals.md#add-funds`

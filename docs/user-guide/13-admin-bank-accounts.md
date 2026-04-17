# Admin — Bank Accounts

**Routes:** `/admin/accounts`, `/admin/accounts/:accountId`

> **Admin only.**

This is the operator view of the bank accounts feature. Admins provision accounts, freeze or close them, inspect transactions, and clean up orphans. For the user-facing view of the same feature, see [Bank Account](07-bank-account.md).

## Admin accounts list

![Admin accounts list](screenshots/26-admin-accounts-list.png)

The page shows a searchable, sortable table:

- **User Name**
- **Email**
- **Account Status** badge
- **Balance**
- **Actions** — View, Create Account (if the user has no account yet), Delete (for orphan accounts)

### Status filter

Dropdown above the table:

- **All** (default)
- **Active**
- **Frozen**
- **Closed**
- **No Account** — users without a bank account at all.
- **Orphan** — accounts whose owning user was deleted.

### Stats cards

A row of cards shows counts per status, useful for at-a-glance monitoring.

## Create an account for a user

Used when a user was provisioned without a bank account, or when they need a fresh one.

1. Filter the list to **No Account**.
2. Click **Create Account** on the user's row.
3. The dialog pre-fills the user. Optionally set:
   - **Initial balance** — usually zero.
   - **Initial description** (if an initial balance is set, this is the text on the first ledger entry).
4. Click **Create**.

The account status becomes `ACTIVE` immediately.

## Account detail page

![Admin account detail](screenshots/27-admin-account-detail.png)

### Header

- User name, email
- Account status badge
- Current balance
- **Change Account Status** button — opens the [status dialog](#change-account-status).
- **Deposit** / **Withdraw** buttons — same dialogs the user sees, but Admins can act on behalf of any user.

### Transaction history

Same table as the user view ([Bank Account › Transaction history](07-bank-account.md#transaction-history)), with the same entry-type filter.

### Recurring deposits

Same list; Admins can pause/resume/cancel schedules on behalf of the user.

## Change account status

1. Open the account detail page.
2. Click **Change Account Status**.
3. Pick a new status:
   - `ACTIVE` — normal operation.
   - `FROZEN` — blocks deposits/withdrawals, preserves balance.
   - `CLOSED` — finalizes the account. Balance should be zero; otherwise the dialog warns you.
4. (Optional) Fill in a **Reason** — audit-visible.
5. Click **Save**.

![Account status dialog](screenshots/28-account-status-dialog.png)

### Allowed transitions

| From | To `ACTIVE` | To `FROZEN` | To `CLOSED` |
|---|---|---|---|
| `ACTIVE` | — | ✅ | ✅ (balance must be 0) |
| `FROZEN` | ✅ | — | ✅ (balance must be 0) |
| `CLOSED` | ❌ | ❌ | — |

Closing is permanent — you cannot reopen a closed account. Create a new one for the user instead.

## Delete an orphan account

An **orphan** account is one whose owning user was deleted. The balance is effectively stranded.

1. Filter the list to **Orphan**.
2. Click **Delete** on the row.
3. Confirm.

> **Warning:** this removes the account and its transaction history. Only delete orphans that you are sure should not be reattached.

## Deposit / withdraw on behalf of a user

Identical UI to the [user-facing flow](07-bank-account.md#deposit), but:

- You are creating the entry as yourself (Admin).
- The entry is audit-logged with your user ID.
- Pick a **Reason Code** that accurately reflects the real-world reason — e.g. "Admin adjustment", "Refund", "Fee reversal".

## Reverse a transaction

1. Open the account detail page.
2. Find the transaction in the history.
3. Click **Reverse** on the row (only available to Admins, only for certain entry types).
4. Confirm in the dialog — the reversal becomes its own ledger entry of type `REVERSAL` with a negated amount.

The original entry is not deleted; the reversal is a new entry pointing at it. Balance adjusts accordingly.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| "Cannot close: balance is non-zero" | The account still has funds | Withdraw (or reverse entries) until balance is zero, then close. |
| Orphan accounts keep appearing | Users are being deleted instead of deactivated | Prefer deactivation; see [User Management](11-admin-users.md#deactivate-vs-delete). |
| Recurring deposit fired twice on the same day | Scheduler retried a crashed worker | Reverse one of the duplicates; investigate the scheduler logs. |
| A user reports their balance is wrong | Misattributed transaction | Use the entry-type filter to narrow down; reverse the erroneous entry with a clear reason. |

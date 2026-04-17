# Bank Account

**Route:** `/account`

Every LendQ user has an optional **bank account** — a simple ledger inside the platform for tracking deposits, withdrawals, and automated recurring deposits. It is independent of your external bank; think of it as a "vault" inside LendQ used to fund savings goals, offset loan payments, or hold aside money for planning.

The page lives under **Account** in the sidebar (desktop) or in the **More** menu (mobile).

## What you see

![Bank account overview](screenshots/13-account-overview.png)

### Header

- **Account balance** — a large card with your current balance.
- **Status badge** — `ACTIVE`, `FROZEN`, `CLOSED`, or `NO_ACCOUNT`.
- Action buttons (hidden or disabled depending on status):
  - **Deposit**
  - **Withdraw**
  - **Set Up Recurring Deposit**

### Transaction history

A paginated table showing every ledger entry for your account:

- **Date**
- **Description** (entry type)
- **Amount** (positive = in, negative = out)
- **Balance after**
- **Type badge** — color-coded

Entry types:

- `MANUAL_DEPOSIT` — you added money.
- `MANUAL_WITHDRAWAL` — you took money out.
- `RECURRING_DEPOSIT` — automated deposit from a recurring schedule.
- `REVERSAL` — an Admin reversed a prior entry.
- `SAVINGS_CONTRIBUTION` — money moved from this account into a [Savings Goal](08-savings-goals.md).
- `SAVINGS_RELEASE` — money moved back from a savings goal into this account.

Use the **Entry type** dropdown above the table to filter to a single type.

### Recurring deposits section

If you have any recurring deposit schedules, they appear as a list below transactions with:

- Amount
- Frequency
- Status (`ACTIVE`, `PAUSED`, `COMPLETED`, `CANCELLED`)
- Next deposit date
- Per-row buttons: **Pause**, **Resume**, **Cancel**

## Deposit

1. Click **Deposit**.
2. Fill in:
   - **Amount** — positive number.
   - **Reason Code** — dropdown of standard reasons (e.g. "Payroll", "Transfer in", "Refund").
   - **Description** — optional free text.
3. A live preview shows the **new balance** underneath the form.
4. Click **Deposit**.

The transaction is appended to your history and the balance updates. Deposits are idempotent — clicking twice with the same form state only posts once.

![Deposit/withdraw dialog](screenshots/14-deposit-dialog.png)

## Withdraw

1. Click **Withdraw**.
2. Same dialog as Deposit, but the amount is subtracted.
3. Withdrawals are rejected if they would drive the balance negative. The dialog shows an inline error before you can submit.

## Set up a recurring deposit

Use this to simulate a standing order — for example, "deposit $50 every Friday".

1. Click **Set Up Recurring Deposit**.
2. Fill in:
   - **Amount per deposit**
   - **Frequency** — Weekly, Biweekly, Monthly
   - **Start Date**
   - **Max deposits** (optional) — leave blank for indefinite.
   - **Description** (optional).
3. Click **Create**.

The schedule begins in `ACTIVE` status immediately. The backend will create a `RECURRING_DEPOSIT` entry on each scheduled date.

### Pause / Resume / Cancel a recurring deposit

From the recurring deposits list on the account page, click the action button on the row. Confirm in the small confirmation modal. Same semantics as [recurring loans](06-recurring-loans.md#pause-resume-cancel):

- **Pause** — stops future deposits.
- **Resume** — restarts from the next scheduled date.
- **Cancel** — permanent; cannot be resumed.

## Account status

Your account can be in one of four states:

- `NO_ACCOUNT` — no bank account provisioned. The Deposit/Withdraw buttons are replaced by "Request an account from your administrator". See [Admin — Bank Accounts](13-admin-bank-accounts.md#create-an-account-for-a-user).
- `ACTIVE` — everything works normally.
- `FROZEN` — you cannot deposit or withdraw; balance is preserved. Contact an Admin to unfreeze.
- `CLOSED` — account is finalized. No new activity is allowed. Balance should be zero at this point.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Deposit/Withdraw buttons are missing | Status is `FROZEN`, `CLOSED`, or you have no account | Ask an Admin to activate / unfreeze / create the account. |
| "Insufficient balance" on withdrawal | Amount exceeds current balance | Lower the amount. Deposit first if you need the cash. |
| Transaction didn't appear | Network error during POST | Refresh. The idempotency key guards against double-posting; the most likely cause is that the request never reached the server. |
| Recurring deposit didn't fire | Template is `PAUSED` or `CANCELLED`; or the scheduler is down | Check status. If `ACTIVE` and still missing, contact an Admin to check the scheduler worker. |

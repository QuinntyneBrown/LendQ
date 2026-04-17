# Savings Goals

**Routes:** `/savings`, `/savings/:id`

A **savings goal** is a named target amount with an optional deadline. You accumulate progress by adding funds — typically from your [Bank Account](07-bank-account.md) balance — until you hit (or exceed) the target.

## Savings goals list

Click **Savings** in the sidebar.

![Savings goals list](screenshots/15-savings-list.png)

The list is a grid of cards (1 column on mobile, 3 on desktop). Each card shows:

- **Goal name**
- **Status badge** — `In Progress`, `Completed`, `Cancelled`, or `Overdue` (past the deadline with target unmet).
- **Progress bar** — percentage toward target.
- **Current / target amounts** — e.g. `$240 / $1,000`.
- **Deadline** (if set).
- **Add Funds** button — shortcut to add money without opening the detail page.

Use the **Create New Goal** button in the top-right.

### Empty state

If you have no goals, the list shows a prompt with a **Create your first goal** button.

## Create a goal

1. Click **Create New Goal**.
2. Fill in:
   - **Name** — what you're saving for (e.g. "Vacation fund").
   - **Target Amount** — positive number.
   - **Deadline** (optional) — date you'd like to hit the target by.
   - **Description** (optional) — free text.
3. Click **Create**.

You land on the new goal's detail page with `0.00 / target` progress.

![Create savings goal](screenshots/16-savings-create.png)

## Savings goal detail

![Savings goal detail](screenshots/17-savings-detail.png)

- **Header** — name, status badge, **Edit Goal** and **Add Funds** buttons.
- **Summary cards** — Target, Current, Remaining, Progress %, Days Left, Deadline.
- **Contributions** — a paginated table of every deposit into the goal with date, amount, and description.

## Add funds

1. Click **Add Funds** (from either the list card or the detail page).
2. Fill in:
   - **Amount** — how much to move into the goal.
   - **Description** — optional note.
3. A live preview shows:
   - **New total** after this contribution.
   - **New progress %**.
4. Click **Add Funds**.

Funds come from your Bank Account. If the bank account balance is insufficient, the dialog shows an inline error before submit.

The contribution appears in the goal's Contributions list and as a `SAVINGS_CONTRIBUTION` entry in your bank account [transaction history](07-bank-account.md#transaction-history).

### Overshooting the target

If your contribution takes the current amount past the target, the goal flips to `Completed` automatically. The extra is still counted in the goal — there is no overflow back to the bank account.

## Edit a goal

1. Open the detail page.
2. Click **Edit Goal**.
3. Change the name, target amount, deadline, or description.
4. Save.

Editing never deletes contributions — it only updates the target or metadata.

## Cancel a goal

Cancelling a goal does **not** refund contributions automatically. If you want the money back:

1. First, release funds back via the **Release to Bank Account** button (if enabled for your tenant).
2. Then cancel the goal.

If release-to-bank is not enabled, cancelling simply marks the goal `Cancelled` and the balance remains accounted for in the contribution history.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| "Insufficient balance" when adding funds | Your bank account balance is below the amount | Deposit into your [Bank Account](07-bank-account.md) first. |
| Goal shows `Overdue` | Deadline passed and target was not met | Edit the goal to extend the deadline, or cancel. |
| Progress % reached 100 but status is still `In Progress` | Caching / rare race condition | Reload the page. |
| Double-clicking Add Funds creates two contributions | The dialog uses an idempotency key, so this should not happen | If it does, report to an Admin. The duplicate can be reversed. |

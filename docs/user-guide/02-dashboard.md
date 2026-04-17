# Dashboard

**Route:** `/dashboard`

The dashboard is the landing page after sign-in. It gives a single-screen summary of your loans, payments, and recent activity.

![Dashboard overview](screenshots/04-dashboard.png)

## What you see

### Welcome header

The page opens with a personalized greeting ("Welcome back, _name_") so you can confirm you are signed in as the right user.

### Summary cards

A row of metric cards along the top of the page. Exact cards depend on your role:

- **Creditors** see totals for money lent, active loans, outstanding balances, and next payments due.
- **Borrowers** see totals for money borrowed, upcoming payments, and any overdue balances.
- **Admins** see a combined view.

Each card shows a single number plus a short description underneath. If a card fails to load, it shows a small **Retry** button — click it to refetch just that card rather than the whole page.

### Active loans panel

A compact list of currently active loans with borrower or creditor name, principal, and status badge. Click any row to open the full [loan detail page](04-loans.md#loan-detail-page).

### Activity feed

A reverse-chronological list of the most recent events:

- New loans created
- Payments recorded
- Schedule changes (reschedule, pause)
- Bank account deposits and withdrawals
- Savings contributions

Each item shows an icon, a short description, and a relative timestamp ("2 hours ago"). Click an item to jump straight to the thing it refers to (the loan, the payment, the savings goal, etc.).

## Common tasks

### Refresh the data

Dashboard panels auto-refresh when you return to the tab and whenever you make a change elsewhere in the app. To force a manual refresh:

- Click any panel's **Retry** button.
- Or reload the browser tab.

### Jump to a specific loan

- **Active loans panel** — click the loan row.
- **Activity feed** — click the activity item; loan-related events open the loan detail page.
- **Sidebar** — click **My Loans** (creditor) or **Borrowings** (borrower) to see the full list.

### Investigate an overdue payment

1. In the **Summary cards**, look for the "Overdue" tile. If the count is above zero, a red indicator shows.
2. Click the tile (or open the sidebar **My Loans** and filter by **Overdue**).
3. Drill into the loan to see which payments are overdue and [record a payment](05-payments.md#record-a-payment) or [reschedule](05-payments.md#reschedule-a-payment).

## Empty states

If you have no loans yet:

- **Creditor:** a prompt links you to [Create a loan](04-loans.md#create-a-loan).
- **Borrower:** a message explains that an Admin or Creditor must invite you to a loan. There is no action you can take yourself until that happens.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| "Failed to load summary" | Backend unreachable or token expired | Click **Retry** on the card. If it keeps failing, sign out and back in. |
| Summary cards show stale numbers | Cached data | Reload the tab. Numbers are cached for a few seconds to avoid re-fetching on every click. |
| Panel keeps spinning | Rate limit or network issue | Open the browser DevTools Network tab to check the response. See [Troubleshooting](16-troubleshooting.md). |

# Loans

**Routes:** `/loans`, `/loans/:id`

A **loan** in LendQ represents money owed by a borrower to a creditor, with terms (principal, interest rate, repayment frequency) and a generated payment schedule. This page covers creating, editing, and inspecting loans. Payment actions live in [Payments](05-payments.md).

## Loans list

Click **My Loans** (creditor) or **Borrowings** (borrower) in the sidebar to open the list.

![Loans list](screenshots/07-loans-list.png)

### Tabs

The top of the page shows a tab toggle:

- **My Loans** — loans you are the creditor on.
- **Borrowings** — loans you are the borrower on.

Admins see both tabs but still filter per role context. The tab you last used is remembered.

### Search and filter

- **Search box** — live filter by borrower name, creditor name, or description. Results update as you type.
- **Status filter dropdown** — restrict to:
  - **All** (default)
  - **Active** — schedule is generating payments
  - **Paused** — temporarily halted
  - **Overdue** — at least one payment is past due
  - **Paid Off** — balance is zero
- **Pagination** — at the bottom. Page size is fixed; use **Next** / **Previous** to move through pages.

### Rows

Each row shows:

- Borrower or counterparty name
- Short description
- Principal amount
- Outstanding balance
- Status badge (color-coded)

Click a row to open its [detail page](#loan-detail-page). On mobile the list is a stack of cards instead of a table.

### Create New Loan button

**Creditors and Admins** see a **Create New Loan** button in the top-right of the page. Borrowers do not — borrowers can only view loans where they are the recipient.

## Create a loan

1. Click **Create New Loan**.
2. Fill in the dialog:
   - **Description** — a short label (e.g. "Car down payment").
   - **Borrower** — type to search the users list; click to select.
   - **Principal** — the amount you are lending, in your currency.
   - **Interest Rate (%)** — annual nominal rate. Enter `0` for an interest-free loan.
   - **Repayment Frequency** — Weekly, Biweekly, Monthly, or Custom.
   - **Number of Payments** — how many payments the schedule should generate.
   - **Start Date** — the date the first payment is due.
   - **Notes** — optional free text visible to both parties.
3. Click **Create Loan**.

![Create loan dialog](screenshots/08-loans-create.png)

When you submit, LendQ:

1. Creates the loan record.
2. Generates a payment schedule based on the principal, rate, frequency, and number of payments.
3. Creates a "loan created" notification for the borrower.
4. Sends you to the new loan's detail page.

### Validation

- **Principal** must be positive.
- **Interest Rate** must be between 0 and 100.
- **Number of Payments** must be at least 1.
- **Start Date** cannot be in the past for a new loan.
- If the borrower already has a loan with the same description from the same creditor, you'll get a warning before submit.

## Loan detail page

![Loan detail](screenshots/09-loan-detail.png)

The loan detail page has five main regions.

### Header

- **Back** arrow → returns to the list.
- **Loan title** — the description you entered.
- **Status badge** — Active, Paused, Overdue, Paid Off.
- **Actions** (creditors only):
  - **Edit Loan** — opens the edit dialog.
  - **Record Payment** — opens the [record payment dialog](05-payments.md#record-a-payment) pre-populated with the next pending payment.

Borrowers see a read-only view — the **Edit Loan** button is hidden. Both parties can record a payment.

### Summary cards

Three metric cards:

- **Outstanding Balance** — principal plus unpaid interest, minus amounts paid.
- **Next Payment Due** — amount and date of the next scheduled payment.
- **Total Interest** — accrued over the life of the loan given the current schedule.

### Loan details

A card showing the static terms: creditor, borrower, principal, interest rate, frequency, start date, and notes. This view is how you confirm what you agreed to.

### Payment Schedule

A paginated table of upcoming payments:

| Due date | Amount due | Amount paid | Status | Actions |

Status values: `SCHEDULED`, `PAID`, `PARTIALLY_PAID`, `OVERDUE`, `PAUSED`, `RESCHEDULED`.

Per-row actions (creditor only):

- **Record** — open the [record payment dialog](05-payments.md#record-a-payment) pre-filled for that specific payment.
- **Reschedule** — change the due date.
- **Pause** — mark the payment as paused (does not remove it from the schedule; see [Payments](05-payments.md#pause-a-payment)).

### Payment History

A reverse-chronological table of payments already recorded:

| Paid date | Method | Amount paid | Notes |

## Edit a loan

**Creditor/Admin only.**

1. Open the loan detail page.
2. Click **Edit Loan** in the header.
3. Change any of:
   - Description
   - Interest Rate
   - Repayment Frequency
   - Notes
4. Click **Save Changes**.

Editing terms creates a **terms version** — the previous terms are preserved and visible through the audit trail. If the borrower has a pending change request, you will see it here and can approve or decline it.

> **Limits on editing:** you cannot change the principal, the borrower, or the start date after creation. If you need to do that, mark the loan paused and create a new one.

## Filter by a specific borrower / creditor

Use the **Search** box on the list page. If you only want to see a single counterparty's loans, type their name and bookmark the URL — the search term is serialized into the query string.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| "Failed to create loan" after clicking Create | Validation error (amount, date, rate) or the backend rejected the payload | Read the inline error under the offending field. For a 422, the field name in the error message points to the culprit. |
| Schedule shows only one row | `Number of Payments` was 1, or the frequency/start combo produced one visible row | Re-check terms; click **Edit Loan** to fix the frequency. |
| Borrower reports they can't see the loan | Borrower was not assigned correctly | Open the loan detail; in the details card, confirm the borrower name. If wrong, you cannot reassign — pause and recreate. |
| **Edit Loan** button missing | You are signed in as the borrower, not the creditor | Only the creditor (or Admin) can edit. |

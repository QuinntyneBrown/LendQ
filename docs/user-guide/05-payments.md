# Payments

Payments are the unit of money movement on a loan. Every loan has a schedule of expected payments; this page shows how to record what actually happened, reschedule a due date, or pause a payment that isn't going to happen on time.

All payment actions live inside a specific loan's detail page. Open the loan from the [Loans list](04-loans.md#loans-list) or the Dashboard first.

## Record a payment

![Record payment dialog](screenshots/10-record-payment.png)

There are two entry points to the **Record Payment** dialog:

1. Header button **Record Payment** → pre-filled with the next pending payment.
2. Per-row **Record** button in the Payment Schedule → pre-filled with that row.

### Fields

- **Scheduled Payment** (read-only card at the top) — shows the due date and expected amount for context.
- **Payment Amount** — defaults to the scheduled amount but you can overwrite it. Partial payments and overpayments are both allowed:
  - If the amount is less than due, the payment row is marked `PARTIALLY_PAID` and the shortfall rolls forward.
  - If the amount exceeds the outstanding balance, the excess is applied to the next unpaid rows in the schedule.
- **Payment Date** — defaults to today. You can back-date if the money actually moved earlier.
- **Payment Method** — optional dropdown: Cash, Bank Transfer, Other. Purely informational; pick whichever matches the real-world transfer.
- **Notes** — optional free text (max 2000 chars).
- **Remaining Balance** preview — a green card that updates live as you change the amount. Shows `$0.00` if the payment covers the balance.

### Submit

Click **Record Payment**. LendQ will:

1. Insert a payment record with the amount, date, method, and notes.
2. Mark the scheduled payment as `PAID` (or `PARTIALLY_PAID` if short).
3. Update the outstanding balance on the loan.
4. If the balance reaches zero, flip the loan status to `PAID_OFF`.
5. Send a "Payment Received" notification to the other party (if they enabled it in [Settings](10-settings.md)).

The dialog closes and you return to the loan detail page with refreshed totals.

### Idempotency

The dialog submits with a unique idempotency key. If the network drops mid-request and you click Record Payment twice, you will not get two payment records.

### Validation

- Amount must be greater than zero.
- Date is required.
- Notes are truncated server-side at 2000 characters.

## Reschedule a payment

Use this when the payment isn't going to land on the original date, but it is still going to happen — you're just moving the due date.

1. Open the loan detail.
2. In the **Payment Schedule** table, click **Reschedule** on the row you want to move.
3. Fill in:
   - **New Date** — the new due date. Must be on or after the loan's start date.
   - **Reason** — optional but recommended. The borrower sees this in their notification.
4. Click **Reschedule**.

LendQ creates a new schedule version, marks the original row `RESCHEDULED`, and adds a new `SCHEDULED` row with the new date. The audit trail retains both.

## Pause a payment

Use this when you want to skip the payment without recording that it happened and without moving the date. Common for emergency holds where the plan is to resume next cycle.

1. Open the loan detail.
2. In the **Payment Schedule**, click **Pause** on the row.
3. A warning box explains: *pausing does not remove the payment from the schedule — it freezes it until resumed or rescheduled.*
4. Fill in an optional **Reason**.
5. Click **Pause**.

The row flips to status `PAUSED`. To unpause, use **Reschedule** with a new date.

## Partial payments — what happens

If someone pays less than the scheduled amount:

- The scheduled row is marked `PARTIALLY_PAID` with `amount_paid < amount_due`.
- The shortfall is tracked against the outstanding balance, not redistributed across future rows.
- The next cycle's row is unchanged.

To catch up, record another payment against the same scheduled row (or the next one) until the balance clears.

## Overpayments — what happens

If someone pays more than the scheduled amount:

- The current row is marked `PAID`.
- The excess is applied to the next `SCHEDULED` or `PARTIALLY_PAID` row, then the next, until exhausted or all rows are paid.
- If the balance reaches zero, the loan flips to `PAID_OFF`.

## Recording a payment on behalf of the borrower

Borrowers and creditors can both record payments. In practice:

- **Creditor** records a payment when cash arrives (e.g. an e-transfer hits their account). This is the normal flow.
- **Borrower** records a payment when they want to log it proactively (e.g. "I sent you $200 today").

Either way, the payment is visible to both parties and both see the same notification. There is no separate "confirm the borrower's claim" step — trust is assumed within a private circle.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| "Record Payment" button is disabled | The loan status is `PAID_OFF` or `CANCELLED` | Nothing to record. If the status is wrong, investigate why the balance hit zero. |
| Dialog shows "Payment Amount must be greater than 0" | You submitted 0 or a negative | Enter a positive number. |
| Outstanding balance didn't update | Stale cache — page data refetches on mutation, but a slow network can delay | Reload the loan detail page. |
| Duplicate payment rows appeared | Two browsers recorded at the same moment with different idempotency keys | Use the Payment History to confirm; if truly duplicated, contact an Admin to reverse one. |
| Wrong date on payment | Typo on the form | Contact an Admin — there is no self-service edit for recorded payments (by design, to preserve the audit trail). |

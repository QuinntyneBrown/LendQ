# Recurring Loans

**Routes:** `/loans/recurring`, `/loans/recurring/:id`

A **recurring loan** is a template that generates a new loan on a fixed cadence. Use it for things like a monthly allowance, a standing credit line, or a subscription-style arrangement where the same terms repeat.

Each generation produces a real, independent loan that shows up on the borrower's Loans list and has its own payment schedule.

## Recurring loan list

Click **Recurring Loans** in the sidebar (desktop) or in the **More** menu (mobile).

![Recurring loans list](screenshots/11-recurring-list.png)

The page shows a table (desktop) or stack of cards (mobile) with:

- Borrower
- Amount per generation
- Frequency
- Status badge — `DRAFT`, `PENDING_APPROVAL`, `ACTIVE`, `PAUSED`, `SUSPENDED`, `COMPLETED`, `CANCELLED`
- Next generation date
- Total generated so far
- Per-row actions: **View**, **Pause**, **Resume**, **Cancel**

Status colors:

- Green — `ACTIVE`
- Yellow — `PAUSED`
- Gray — `COMPLETED`, `CANCELLED`
- Blue — `DRAFT`, `PENDING_APPROVAL`

Use the **Set Up Recurring Loan** button in the top-right to create a new template.

## Create a recurring loan

**Creditor/Admin only.**

1. Click **Set Up Recurring Loan**.
2. Fill in the dialog:
   - **Description** — a short label.
   - **Borrower** — type to search, click to select.
   - **Principal per Generation** — amount of each generated loan.
   - **Interest Rate (%)** — applied to each generated loan. `0` for interest-free.
   - **Generation Frequency** — how often a new loan is created (Weekly, Biweekly, Monthly).
   - **Repayment Frequency** — how often the borrower pays on each generated loan.
   - **Number of Payments per loan** — how many payments each generated loan has.
   - **Max Generations** (optional) — stop generating after this many. Leave blank for indefinite.
   - **Start Date** — when to generate the first loan.
   - **Notes** — optional.
3. Click **Create**.

The template is created in `DRAFT` status so you can review before it starts generating.

## Activate a draft

From the recurring loan **detail page**:

1. Click **Submit for Approval** (if `DRAFT`).
2. The status moves to `PENDING_APPROVAL`.
3. An Admin approves it, flipping status to `ACTIVE`.

Once `ACTIVE`, the backend generates loans automatically at the configured cadence.

## Recurring loan detail page

![Recurring loan detail](screenshots/12-recurring-detail.png)

Contains:

- **Header** — title, status badge, and context-dependent action buttons:
  - **Edit** — only when `DRAFT`, `PAUSED`, or `SUSPENDED`.
  - **Submit for Approval** — only when `DRAFT`.
  - **Pause** — only when `ACTIVE`.
  - **Resume** — only when `PAUSED`.
  - **Cancel** — only when not already `COMPLETED` or `CANCELLED`.
- **Summary cards** — Total Principal (sum across all generated loans), Total Generated (count), Outstanding Balance, Next Generation date.
- **Generated loans** — paginated table of loans this template has produced. Columns: sequence number, start date, status, principal, outstanding balance, per-row **View** icon.

Click a generated loan's View icon to open its detail page (it is an ordinary loan at that point).

## Pause, resume, cancel

Each of the three uses the same dialog with different verbs.

1. Click **Pause**, **Resume**, or **Cancel** from the detail page or the list page row.
2. Confirm in the dialog:
   - Pause / Resume / Cancel — optional **Reason**.
3. Click the matching confirm button.

### What each action does

- **Pause** — stops generating new loans. Existing generated loans are unaffected.
- **Resume** — restarts generation from the next scheduled date (never back-fills missed dates).
- **Cancel** — permanently stops generation. You cannot resume a cancelled template; create a new one if you change your mind.

## Editing

You can edit a recurring loan when it is `DRAFT`, `PAUSED`, or `SUSPENDED`:

1. Open the detail page.
2. Click **Edit**.
3. Change any editable field (most fields, except borrower).
4. Save.

Edits create a **template version** — previous terms are preserved in history. Loans already generated are not touched.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| New loans aren't being generated | Template is `DRAFT`, `PAUSED`, or `CANCELLED` | Move to `ACTIVE` via submit/approve or resume. |
| Max generations reached | Template hit `maxGenerations` and auto-completed | Create a new template or raise the limit on a fresh one. |
| "Edit button disabled" | Status is `ACTIVE`, `PENDING_APPROVAL`, or terminal | Pause first, then edit, then resume. |
| Borrower sees too many loans | Every generation is a real loan — by design | Consider cancelling and creating a single larger loan instead. |

---
id: 2026-04-17-next-payment-card-shows-start-date
title: Loan "Next Payment" summary card shows the loan's start date, not the next unpaid payment's due date
status: fixed
severity: medium
area: frontend
reported_by: claude
reported_at: 2026-04-17
fixed_at: 2026-04-17
fixed_in: frontend/src/loans/LoanSummaryCards.tsx (nextPaymentDate prop) + LoanDetailPage.tsx (threaded prop, expanded pending statuses)
---

## Summary

The Next Payment metric card on the loan detail page renders the loan's `start_date` instead of the due date of the next unpaid scheduled payment. This is misleading and user-guide-contradicting: borrowers look at this card to know when they need to pay next, and a loan that is 60 days in will still show its start date as if no payments have been made.

## Environment

- Environment: staging (`https://lemon-wave-0a1790b0f.6.azurestaticapps.net/`)
- Commit / version: `vcf53b53`
- User role: Creditor (`creditor@lendq.local`) viewing `/loans/2528d433-…`

## Steps to reproduce

1. Sign in as `creditor@lendq.local`.
2. Navigate to the "Personal loan for home improvement" loan detail page (`/loans/2528d433-8514-4110-a8ee-0c60245a7ead`).
3. Observe the summary cards at the top of the page.
4. Compare "Next Payment" (top-right card) with the Payment Schedule table below.

## Expected behavior

Per [`docs/user-guide/04-loans.md#summary-cards`](../user-guide/04-loans.md#summary-cards):

> **Next Payment Due** — amount and date of the next scheduled payment.

The card should show the **earliest due date among unpaid payments** (status `SCHEDULED`, `OVERDUE`, `RESCHEDULED`, or `PARTIALLY_PAID`). In the screenshotted loan, that is **May 17, 2026**.

## Actual behavior

Card shows **Feb 16, 2026** — the loan's `start_date`. Two prior payments (Mar 18 and Apr 17) are already marked `Paid` in the same view, so "next payment = start date" is demonstrably wrong. Screenshot: `docs/audit-artifacts/iter9-after-record.png`.

## Root cause analysis

`frontend/src/loans/LoanSummaryCards.tsx:12`:

```tsx
const nextPayment = loan.start_date ? formatDate(loan.start_date) : "—";
```

The card directly formats the loan's `start_date` — a shortcut that works on day zero of a brand-new loan but is wrong for every other state.

The detail page already computes the correct value: `frontend/src/loans/LoanDetailPage.tsx:34-36`:

```tsx
const pendingStatuses = ["SCHEDULED", "OVERDUE", "RESCHEDULED"];
const nextPendingPayment = payments?.find((p) => pendingStatuses.includes(p.status));
```

That value is just not threaded into the summary card.

## Suggested fix

Accept an optional `nextPaymentDate` prop on `LoanSummaryCards`; fall back to `loan.start_date` only when there are no pending payments (e.g. a brand-new loan whose schedule hasn't been queried yet). Also include `PARTIALLY_PAID` in the pending filter so a loan with a half-paid row keeps surfacing that row as "next".

Thread `nextPendingPayment?.due_date` from `LoanDetailPage` into the component.

## Impact and workaround

Medium. Every loan past its first payment shows the wrong date in the most prominent "when do I pay next" UI element. Data layer is correct; only display.

Workaround: look at the Payment Schedule table directly.

## Related

- File: `frontend/src/loans/LoanSummaryCards.tsx:12`
- Caller: `frontend/src/loans/LoanDetailPage.tsx:119`
- Guide: `docs/user-guide/04-loans.md#summary-cards`

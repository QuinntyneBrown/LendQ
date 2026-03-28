# Module 11: Frontend - Payment Tracking & Scheduling

**Requirements**: L1-4, L1-9, L2-4.1, L2-4.2, L2-4.3, L2-4.4, L2-4.5, L2-4.6, L2-4.7, L2-9.1, L2-9.3, L2-9.4

**Backend API**: [04-payment-tracking.md](04-payment-tracking.md)

## Overview

The payment feature renders the active schedule, immutable transaction history, allocation previews, reversal actions, and schedule-adjustment flows. It aligns the UI to the ledger-based backend instead of the old mutable payment-row model. The frontend is built with Blazor WebAssembly (.NET 8, C# 12), using Razor components, injectable services via DI, and `EditForm` with `DataAnnotationsValidator` for form handling.

## Class Diagram

![Class - Payment Module](diagrams/rendered/fe_class_payment.png)

*Source: [diagrams/plantuml/fe_class_payment.puml](diagrams/plantuml/fe_class_payment.puml)*

## Primary Components

| Component | Purpose |
|---|---|
| `PaymentScheduleView.razor` | Show current schedule version, original dates, and status badges |
| `RecordPaymentDialog.razor` | `EditForm` with `DataAnnotationsValidator` to collect amount, date, method, and notes, then display allocation preview |
| `ScheduleAdjustmentDialog.razor` | Reschedule or pause installments, either direct apply or request mode |
| `PaymentHistoryView.razor` | Immutable transaction timeline including reversals and schedule events |
| `ReversePaymentDialog.razor` | Confirm compensating reversal with reason capture |

## API Integration

All HTTP calls are made through `IPaymentService`, which wraps an injected `HttpClient` instance.

| Action | Endpoint |
|---|---|
| Schedule | `GET /api/v1/loans/{id}/schedule` |
| Payment transactions | `GET /api/v1/loans/{id}/payments` |
| Record payment | `POST /api/v1/loans/{id}/payments` with `Idempotency-Key` |
| Reverse payment | `POST /api/v1/payments/{paymentId}/reversals` with `Idempotency-Key` |
| Reschedule | `POST /api/v1/loans/{id}/schedule-adjustments/reschedule` |
| Pause | `POST /api/v1/loans/{id}/schedule-adjustments/pause` |
| Unified history | `GET /api/v1/loans/{id}/history` |

## Sequence Diagram

![Sequence - Record Payment](diagrams/rendered/fe_seq_record_payment.png)

*Source: [diagrams/plantuml/fe_seq_record_payment.puml](diagrams/plantuml/fe_seq_record_payment.puml)*

## Payment UX Rules

- Record-payment submit is disabled after the first click until the service call resolves; the component tracks a `_isSubmitting` flag and re-renders via `StateHasChanged`.
- Each submit generates an idempotency key (`Guid.NewGuid()`) before calling the API through `IPaymentService`.
- The `RecordPaymentDialog.razor` `EditForm` submits a `RecordPaymentModel` containing `Amount`, `PostedAt`, `PaymentMethod`, and `Notes`; payment method is never omitted from the payload.
- Success feedback includes the transaction id and refreshed allocation results. The service raises a state-change notification that triggers `StateHasChanged` in dependent components (schedule view, history, dashboard).

## Role Behavior

- Creditors can record payments, apply direct schedule changes, and reverse eligible payments.
- Borrowers can record payments and submit schedule-adjustment requests. When a borrower opens reschedule or pause, the dialog operates in request mode if approval is required.
- History clearly distinguishes payments, reversals, reschedules, pauses, and approvals.

## Resilience

- Recoverable failures keep `EditForm` input in place; the model binding preserves all field values so the user can retry.
- Conflict or stale-version responses show an actionable refresh-and-review state, handled by the service returning a typed error that the component renders as a prompt to reload.
- Balance preview labels itself as projected until the authoritative response returns.

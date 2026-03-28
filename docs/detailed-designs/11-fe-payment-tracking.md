# Module 11: Frontend - Payment Tracking & Scheduling

**Requirements**: L1-4, L1-9, L2-4.1, L2-4.2, L2-4.3, L2-4.4, L2-4.5, L2-4.6, L2-4.7, L2-9.1, L2-9.3, L2-9.4

**Backend API**: [04-payment-tracking.md](04-payment-tracking.md)

## Overview

The payment feature renders the active schedule, immutable transaction history, allocation previews, reversal actions, and schedule-adjustment flows. It aligns the UI to the ledger-based backend instead of the old mutable payment-row model. All components are Angular standalone components using Angular Material, Reactive Forms, and `@Injectable` services for API communication.

## Class Diagram

![Class - Payment Module](diagrams/rendered/fe_class_payment.png)

*Source: [diagrams/plantuml/fe_class_payment.puml](diagrams/plantuml/fe_class_payment.puml)*

## Primary Components

| Component | Purpose |
|---|---|
| `PaymentScheduleViewComponent` | Show current schedule version in `mat-table`, original dates, and status badges (`mat-chip`) |
| `RecordPaymentDialogComponent` | `MatDialog` to collect amount, date (`mat-datepicker`), method (`mat-select`), and notes, then display allocation preview |
| `ScheduleAdjustmentDialogComponent` | `MatDialog` to reschedule or pause installments, either direct apply or request mode |
| `PaymentHistoryViewComponent` | Immutable transaction timeline using `mat-list` including reversals and schedule events |
| `ReversePaymentDialogComponent` | `MatDialog` to confirm compensating reversal with reason capture (`mat-form-field`) |

## PaymentService

`PaymentService` is an `@Injectable({ providedIn: 'root' })` service that wraps `HttpClient` calls:

```typescript
@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly apiUrl = '/api/v1';

  constructor(private http: HttpClient) {}

  getSchedule(loanId: string): Observable<Schedule> {
    return this.http.get<Schedule>(`${this.apiUrl}/loans/${loanId}/schedule`);
  }

  getPayments(loanId: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.apiUrl}/loans/${loanId}/payments`);
  }

  recordPayment(loanId: string, data: RecordPaymentRequest): Observable<Payment> {
    const idempotencyKey = crypto.randomUUID();
    return this.http.post<Payment>(`${this.apiUrl}/loans/${loanId}/payments`, data, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
  }

  reversePayment(paymentId: string, data: ReversePaymentRequest): Observable<Payment> {
    const idempotencyKey = crypto.randomUUID();
    return this.http.post<Payment>(`${this.apiUrl}/payments/${paymentId}/reversals`, data, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
  }
}
```

## API Integration

| Action | Endpoint |
|---|---|
| Schedule | `GET /api/v1/loans/{id}/schedule` |
| Payment transactions | `GET /api/v1/loans/{id}/payments` |
| Record payment | `POST /api/v1/loans/{id}/payments` with `Idempotency-Key` |
| Reverse payment | `POST /api/v1/payments/{paymentId}/reversals` with `Idempotency-Key` |
| Reschedule | `POST /api/v1/loans/{id}/schedule-adjustments/reschedule` |
| Pause | `POST /api/v1/loans/{id}/schedule-adjustments/pause` |
| Unified history | `GET /api/v1/loans/{id}/history` |

## Record Payment Form

The `RecordPaymentDialogComponent` uses Reactive Forms:

```typescript
this.paymentForm = new FormGroup({
  amount: new FormControl(null, [Validators.required, Validators.min(0.01)]),
  posted_at: new FormControl(null, [Validators.required]),
  payment_method: new FormControl('', [Validators.required]),
  notes: new FormControl(''),
});
```

## Sequence Diagram

![Sequence - Record Payment](diagrams/rendered/fe_seq_record_payment.png)

*Source: [diagrams/plantuml/fe_seq_record_payment.puml](diagrams/plantuml/fe_seq_record_payment.puml)*

## Payment UX Rules

- Record-payment submit button is disabled via `[disabled]="submitting()"` after the first click until the request resolves.
- Each submit generates an idempotency key via `crypto.randomUUID()` before calling the API through `PaymentService`.
- The dialog sends `amount`, `posted_at`, `payment_method`, and `notes`; payment method is never omitted from the payload.
- Success feedback includes the transaction id displayed in a `MatSnackBar` toast and refreshed allocation results.

## Role Behavior

- Creditors can record payments, apply direct schedule changes, and reverse eligible payments.
- Borrowers can record payments and submit schedule-adjustment requests. When a borrower opens reschedule or pause, the dialog operates in request mode if approval is required.
- History clearly distinguishes payments, reversals, reschedules, pauses, and approvals using distinct `mat-icon` indicators and status labels.

## Resilience

- Recoverable failures keep form input in place within the `MatDialog`.
- Conflict or stale-version responses show an actionable refresh-and-review state via a secondary `MatDialog`.
- Balance preview labels itself as projected until the authoritative response returns.

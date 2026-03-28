# Module 10: Frontend - Loan Management

**Requirements**: L1-3, L1-10, L2-3.1, L2-3.2, L2-3.3, L2-3.4, L2-3.5, L2-7.5, L2-10.3

**Backend API**: [03-loan-management.md](03-loan-management.md)

## Overview

The loan feature covers loan list views, loan detail, creditor create and edit flows, terms history, and borrower change-request flows. It removes the prior borrower direct-edit path and aligns all creation and edit behavior to the new contract. All components are Angular standalone components using Angular Material, Reactive Forms with validators, and `@Injectable` services for API communication.

## Class Diagram

![Class - Loan Management](diagrams/rendered/fe_class_loan.png)

*Source: [diagrams/plantuml/fe_class_loan.puml](diagrams/plantuml/fe_class_loan.puml)*

## Primary Screens

| Screen | Purpose |
|---|---|
| `LoanListComponent` | Creditor and borrower tabs (`mat-tab-group`) with search and status filters (`mat-select`, `mat-form-field`) |
| `LoanDetailComponent` | Summary, terms, schedule, history, and contextual actions using `mat-card` sections |
| `CreateEditLoanDialogComponent` | Creditor-only create/edit `MatDialog` with schedule builder and preview |
| `LoanChangeRequestDialogComponent` | Borrower request flow for creditor-controlled term changes via `MatDialog` |
| `TermsHistoryPanelComponent` | Side-by-side view of previous and current terms versions |

## LoanService

`LoanService` is an `@Injectable({ providedIn: 'root' })` service that wraps `HttpClient` calls:

```typescript
@Injectable({ providedIn: 'root' })
export class LoanService {
  private readonly apiUrl = '/api/v1';

  constructor(private http: HttpClient) {}

  getLoans(params: LoanListParams): Observable<PaginatedResponse<Loan>> {
    return this.http.get<PaginatedResponse<Loan>>(`${this.apiUrl}/loans`, { params: toHttpParams(params) });
  }

  getLoan(id: string): Observable<Loan> {
    return this.http.get<Loan>(`${this.apiUrl}/loans/${id}`);
  }

  createLoan(data: CreateLoanRequest): Observable<Loan> {
    return this.http.post<Loan>(`${this.apiUrl}/loans`, data);
  }

  updateLoan(id: string, data: UpdateLoanRequest): Observable<Loan> {
    return this.http.patch<Loan>(`${this.apiUrl}/loans/${id}`, data);
  }
}
```

## Create/Edit Form

The `CreateEditLoanDialogComponent` uses Reactive Forms with validators and dynamic form arrays for custom schedule rows:

Required fields now include:

- borrower (autocomplete via `mat-autocomplete` bound to `UserService.searchBorrowers()`)
- description
- principal amount
- currency
- interest rate
- repayment frequency (`mat-select`)
- installment count or maturity date (`mat-datepicker`)
- start date (`mat-datepicker`)
- optional custom schedule rows (`FormArray`)
- notes

```typescript
this.loanForm = new FormGroup({
  borrower_id: new FormControl('', [Validators.required]),
  description: new FormControl('', [Validators.required, Validators.maxLength(500)]),
  principal_amount: new FormControl(null, [Validators.required, Validators.min(0.01)]),
  currency: new FormControl('', [Validators.required, currencyCodeValidator]),
  interest_rate: new FormControl(null, [Validators.required, Validators.min(0)]),
  repayment_frequency: new FormControl('', [Validators.required]),
  installment_count: new FormControl(null),
  maturity_date: new FormControl(null),
  start_date: new FormControl(null, [Validators.required]),
  custom_schedule: new FormArray([]),
  notes: new FormControl(''),
});
```

The form renders a generated schedule preview and summary before submission using a computed signal or Observable pipeline.

## API Integration

| Action | Endpoint |
|---|---|
| List loans | `GET /api/v1/loans` |
| Loan detail | `GET /api/v1/loans/{id}` |
| Borrower directory search | `GET /api/v1/users/borrowers?search=` |
| Create loan | `POST /api/v1/loans` |
| Update loan | `PATCH /api/v1/loans/{id}` |
| Terms history | `GET /api/v1/loans/{id}/terms-versions` |
| Change requests | `GET /api/v1/loans/{id}/change-requests` |
| Submit change request | `POST /api/v1/loans/{id}/change-requests` |
| Approve or reject request | `POST /api/v1/loans/{id}/change-requests/{requestId}/approve|reject` |

## Sequence Diagram

![Sequence - Create Loan](diagrams/rendered/fe_seq_create_loan.png)

*Source: [diagrams/plantuml/fe_seq_create_loan.puml](diagrams/plantuml/fe_seq_create_loan.puml)*

## Governance Rules In The UI

- Borrowers can view full loan details but do not see the general edit route or edit button.
- Borrowers get `Request change` actions that open `LoanChangeRequestDialogComponent`.
- Creditor edits include `expected_terms_version` in the payload and show a conflict dialog (`MatDialog`) if the server returns `409`.
- Approved requests update the terms history panel and trigger Observable re-fetch for loan detail, schedule, dashboard, and notifications.

## Validation

The loan form uses custom cross-field validators:

- currency as ISO 4217 via a custom `currencyCodeValidator`
- supported repayment frequency
- exactly one of installment count, maturity date, or custom schedule strategy (cross-field validator on the `FormGroup`)
- positive currency-formatted principal
- consistent custom schedule totals and dates (custom `FormArray` validator)

# Module 10: Frontend - Loan Management

**Requirements**: L1-3, L1-10, L2-3.1, L2-3.2, L2-3.3, L2-3.4, L2-3.5, L2-7.5, L2-10.3

**Backend API**: [03-loan-management.md](03-loan-management.md)

## Overview

The loan feature covers loan list views, loan detail, creditor create and edit flows, terms history, and borrower change-request flows. It removes the prior borrower direct-edit path and aligns all creation and edit behavior to the new contract. The frontend is built with Blazor WebAssembly (.NET 8, C# 12), using Razor components, injectable services via DI, and `EditForm` with `DataAnnotationsValidator` and FluentValidation for form handling.

## Class Diagram

![Class - Loan Management](diagrams/rendered/fe_class_loan.png)

*Source: [diagrams/plantuml/fe_class_loan.puml](diagrams/plantuml/fe_class_loan.puml)*

## Primary Screens

| Screen | Purpose |
|---|---|
| `LoanListPage.razor` | Creditor and borrower tabs with search and status filters |
| `LoanDetailPage.razor` | Summary, terms, schedule, history, and contextual actions |
| `CreateEditLoanDialog.razor` | Creditor-only create/edit `EditForm` with `DataAnnotationsValidator`, schedule builder, and preview |
| `LoanChangeRequestDialog.razor` | Borrower request flow for creditor-controlled term changes |
| `TermsHistoryPanel.razor` | Side-by-side view of previous and current terms versions |

## Create/Edit Form

The `CreateEditLoanDialog.razor` component uses an `EditForm` bound to a `LoanFormModel` with `DataAnnotationsValidator` for field-level rules and a FluentValidation `IValidator<LoanFormModel>` registered in DI for cross-field logic. Required fields now include:

- borrower (selected via `BorrowerDirectorySelect.razor` component)
- description
- principal amount
- currency
- interest rate
- repayment frequency
- installment count or maturity date
- start date
- optional custom schedule rows
- notes

The form renders a generated schedule preview and summary before submission. Form state is held in the component and submitted through `ILoanService`, an injectable service registered in the DI container. On successful submission the service raises a state-change notification that triggers `StateHasChanged` in dependent components (loan list, loan detail, dashboard).

## API Integration

All HTTP calls are made through `ILoanService`, which wraps an injected `HttpClient` instance.

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
- Borrowers get `Request change` actions that open `LoanChangeRequestDialog.razor`.
- Creditor edits include `expected_terms_version` in the payload and show a conflict dialog if the server returns `409`.
- Approved requests update the terms history panel and trigger service-level cache invalidation with `StateHasChanged` callbacks on the loan detail, schedule, dashboard, and notification components via cascading parameters or injected notification services.

## Validation

The `LoanFormModel` uses `DataAnnotations` attributes for simple rules and a FluentValidation `LoanFormModelValidator` for complex cross-field logic. The validator enforces:

- currency as ISO 4217
- supported repayment frequency
- exactly one of installment count, maturity date, or custom schedule strategy
- positive currency-formatted principal
- consistent custom schedule totals and dates

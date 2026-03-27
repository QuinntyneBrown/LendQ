# Module 10: Frontend — Loan Management

**Requirements**: L1-3, L2-3.1, L2-3.2, L2-3.3, L2-3.4

**Backend API**: [03-loan-management.md](03-loan-management.md)

## Overview

The frontend loan management module provides screens for creditors to create and manage loans, and for borrowers to view and interact with their loans. The loan list supports both creditor and borrower views via a tab toggle. The loan detail screen shows full loan information with summary cards and integrates with the payment module for schedule display and payment actions.

## Class Diagram

![Class — Loan Management](diagrams/rendered/fe_class_loan.png)

*Source: [diagrams/rendered/fe_class_loan.png](diagrams/rendered/fe_class_loan.png)*

## Screen Designs (from ui-design.pen)

### Loan Detail Screen — Desktop

**Design reference**: `Loan Detail - Desktop` (1440px)

| Element | Design Details |
|---------|---------------|
| **Layout** | Standard app shell: sidebar (280px, `My Loans` active) + main content (`#F6F7F8` bg, 32px padding) |
| **Header** | Left: back arrow + "Kitchen Renovation Loan" (Bricolage Grotesque 24px 700-weight) + Active status badge. Right: Secondary "Edit Loan" button + Primary "Record Payment" button |
| **Summary Cards Row** | 4 `MetricCard` components in a row, each with icon circle, label, and value: Principal ($5,000), Total Paid ($1,200), Outstanding ($3,800), Next Payment (Mar 15, 2025) |
| **Two-Column Layout** | Left: Loan Information card. Right: Payment Schedule card |
| **Loan Info Card** | White card with details: Borrower (with avatar), Creditor, Description, Interest Rate, Repayment Frequency, Start Date, Notes. Each as label/value pairs |
| **Payment Schedule Card** | White card with table: Date, Amount, Status (with badges), Actions (Record/Reschedule/Pause buttons). Rescheduled payments show original date with strikethrough |

**Responsive behavior**:
- Tablet: summary cards in 2x2 grid, two-column becomes stacked
- Mobile: summary cards stacked vertically, single-column layout, payment schedule as card list

### Create/Edit Loan Modal

**Design reference**: `Create/Edit Loan Modal` (520px width)

| Element | Design Details |
|---------|---------------|
| **Header** | "Create New Loan" or "Edit Loan" (Bricolage Grotesque 18px 700-weight) + close `x` icon |
| **Borrower** | `Select` component with label "Borrower", placeholder "Select a family member", chevron icon |
| **Description** | `InputGroup` with `file-text` icon, placeholder "e.g. Kitchen renovation" |
| **Row 1** | Two fields side-by-side: Principal Amount (`InputGroup` with `dollar-sign` icon) + Interest Rate (`InputGroup` with `percent` icon, "(optional)") |
| **Row 2** | Two fields side-by-side: Repayment Frequency (`Select` — Weekly, Bi-weekly, Monthly, Custom) + Start Date (`InputGroup` with `calendar` icon) |
| **Notes** | `Textarea` with placeholder "Additional notes about this loan...", label "Notes (optional)" |
| **Footer** | Right-aligned: Ghost "Cancel" + Primary "Create Loan" / "Save Changes" |
| **Corner Radius** | 20px, shadow |

**Responsive**: Full-screen on mobile. Two-column rows become single-column.

### Loan List Screen

The loan list screen is accessed at `/loans` and provides a tabbed view:
- **"My Loans" tab** (Creditor view): Loans where the user is the creditor
- **"Borrowings" tab** (Borrower view): Loans where the user is the borrower

Or accessed directly via sidebar navigation:
- "My Loans" nav item -> `/loans?view=creditor`
- "Borrowings" nav item -> `/loans?view=borrower`

| Element | Description |
|---------|-------------|
| **Header** | Title "My Loans" or "Borrowings" + "Create New Loan" primary button (creditor view only) |
| **Search/Filter** | Search bar + status filter dropdown (Active, Paused, Overdue, Paid Off) |
| **Table (desktop)** | Columns: Borrower/Creditor, Description, Principal, Balance, Next Due, Status (badge), Actions |
| **Cards (mobile)** | Each card: name, description, principal/balance, status badge, next due date, tap to navigate to detail |

**Status badges** use the design system colors:
- Active: `#DCFCE7` bg, `#16A34A` text
- Overdue: `#FEE2E2` bg, `#DC2626` text
- Paused: `#FFFBEB` bg, `#CA8A04` text
- Paid Off: `#F0F5FF` bg, `#2563EB` text

## API Integration

| Action | Hook | API Endpoint | Cache Key |
|--------|------|-------------|-----------|
| List loans | `useLoans(view, page, search, status)` | `GET /api/v1/loans?page=&search=&status=` | `["loans", {view, page, search, status}]` |
| Loan detail | `useLoanDetail(id)` | `GET /api/v1/loans/{id}` | `["loans", id]` |
| Create loan | `useCreateLoan` | `POST /api/v1/loans` | Invalidates `["loans"]` |
| Update loan | `useUpdateLoan` | `PUT /api/v1/loans/{id}` | Invalidates `["loans"]`, `["loans", id]` |

## Sequence Diagram — Create Loan

![Sequence — Create Loan](diagrams/rendered/fe_seq_create_loan.png)

*Source: [diagrams/rendered/fe_seq_create_loan.png](diagrams/rendered/fe_seq_create_loan.png)*

**Behavior**:
1. Creditor clicks "Create New Loan" on the loan list page. The `CreateEditLoanModal` opens.
2. The `BorrowerSelect` component renders a searchable dropdown. As the creditor types, it calls `GET /api/v1/users?role=Borrower&search=...` to fetch matching users.
3. Creditor selects a borrower and fills in principal, interest rate, repayment frequency, start date, description, and optional notes.
4. On clicking "Create Loan", the form validates client-side (all required fields, principal > 0, valid date).
5. If validation fails, inline errors are shown per field.
6. If validation passes, `useCreateLoan.mutate(formData)` sends `POST /api/v1/loans`.
7. On success (201): the `["loans"]` query cache is invalidated (triggers refetch of loan list), a success toast "Loan created" is shown, and the modal closes. The user can optionally be navigated to the new loan's detail page.
8. On error (422): validation errors from the backend `details` object are mapped to form fields.

## Borrower Edit Restrictions

When a borrower edits a loan (`/loans/:id/edit`):
- The principal amount field is rendered as **read-only** (disabled input with a lock icon and tooltip "Only the creditor can modify the principal amount").
- All other fields remain editable.
- The backend enforces this with a 403 if the borrower attempts to change `principal` in the PUT request.

## Loan Detail Data Assembly

The `LoanDetailPage` composes data from multiple sources:

1. **Loan data**: `useLoanDetail(id)` — loan metadata, status, creditor/borrower names
2. **Payment schedule**: `usePaymentSchedule(id)` — from the Payment module (see [11-fe-payment-tracking.md](11-fe-payment-tracking.md))
3. **Payment history**: `usePaymentHistory(id)` — from the Payment module

These are fetched in parallel via TanStack Query and render with loading skeletons until all data is available.

## Form Validation

### Create/Edit Loan Schema (Zod)

| Field | Rules |
|-------|-------|
| borrower_id | Required (select from dropdown) |
| description | Required, min 3 characters, max 500 |
| principal | Required, positive number, max 999,999.99 |
| interest_rate | Optional, 0–100, defaults to 0 |
| repayment_frequency | Required, one of: WEEKLY, BIWEEKLY, MONTHLY, CUSTOM |
| start_date | Required, valid date, must be today or future |
| notes | Optional, max 2000 characters |

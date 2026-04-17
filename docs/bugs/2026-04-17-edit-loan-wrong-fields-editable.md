---
id: 2026-04-17-edit-loan-wrong-fields-editable
title: Edit Loan dialog enables the wrong set of fields — immutable fields are editable, Interest Rate is disabled
status: open
severity: high
area: frontend
reported_by: claude
reported_at: 2026-04-17
---

## Summary

The Edit Loan dialog contradicts the user guide on three fields:

- **Borrower** — UI allows the user to swap the borrower; user guide says this is permanently set at creation.
- **Start Date** — UI is a live `<input type="date">`; user guide says this is permanently set at creation.
- **Interest Rate** — UI disables the input; user guide lists it as one of four explicitly-editable fields.

Net effect: the creditor can corrupt a loan's audit trail (reassign the borrower, shift the start date) but cannot perform the edit that's most likely to come up in practice (adjusting the rate).

## Environment

- Environment: staging (`https://lemon-wave-0a1790b0f.6.azurestaticapps.net/`)
- Commit / version: `va413ec2`
- User role: Creditor (`creditor@lendq.local`)

## Steps to reproduce

1. Sign in as `creditor@lendq.local`.
2. Open any active loan (e.g. `/loans/2528d433-…`).
3. Click **Edit Loan**.
4. Observe each field in the dialog and whether it is editable.

## Expected behavior

Per [`docs/user-guide/04-loans.md#edit-a-loan`](../user-guide/04-loans.md#edit-a-loan):

> Change any of: Description, Interest Rate, Repayment Frequency, Notes.
> **Limits on editing:** you cannot change the principal, the borrower, or the start date after creation.

So the editable set in edit mode is **Description, Interest Rate, Repayment Frequency, Notes**, and Principal/Borrower/Start Date must all be read-only.

## Actual behavior

| Field | Expected in edit mode | Actual |
|---|---|---|
| Description | Editable | ✅ Editable |
| Principal | Read-only | ✅ Read-only |
| Interest Rate | Editable | ❌ Read-only |
| Borrower | Read-only | ❌ Editable |
| Start Date | Read-only | ❌ Editable |
| Repayment Frequency | Editable | ✅ Editable |
| Notes | Editable | ✅ Editable |

Screenshot: `docs/audit-artifacts/iter11-edit-loan.png`.

## Root cause analysis

`frontend/src/loans/CreateEditLoanModal.tsx`:

- Line 147-153: `BorrowerSelect` is rendered unconditionally; there is no `disabled` prop wired based on `isEdit`.
- Line 168: Principal correctly `disabled={isEdit}`.
- Line 177: Interest Rate incorrectly `disabled={isEdit}` — disables the wrong field.
- Line 210-216: `Start Date` input has no `disabled={isEdit}`.

The contract was probably "lock everything in edit mode" when the component was first written, then "allow interest and terms updates" was layered on without revisiting the lock set.

## Suggested fix

In `CreateEditLoanModal.tsx`:

1. Remove `disabled={isEdit}` from the Interest Rate input.
2. Add `disabled={isEdit}` to the Start Date input.
3. Pass a `disabled={isEdit}` (or similar) prop to `BorrowerSelect` and have it render as a non-interactive label in edit mode (with the borrower name visible but unswappable).

Also add a backend guard — the PATCH endpoint for loans should reject any attempt to change `borrower_id` or `start_date`, so even if the UI is bypassed (e.g. via curl) the audit trail stays honest.

## Impact and workaround

High. Two of the disallowed fields are data-integrity fields: changing `borrower_id` silently reassigns an entire loan to a different person; changing `start_date` invalidates the payment schedule. Neither should be reachable from the UI.

Meanwhile the single most common edit — adjusting the interest rate — is blocked.

## Related

- File: `frontend/src/loans/CreateEditLoanModal.tsx:147,168,177,210`
- Guide: `docs/user-guide/04-loans.md#edit-a-loan`

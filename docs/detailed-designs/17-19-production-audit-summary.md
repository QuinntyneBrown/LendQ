# Audit Summary: Modules 17-19

**Audit date**: March 29, 2026

## Scope

This audit reviewed and updated the detailed designs for:

- Module 17: Bank Accounts & Fund Management
- Module 18: Savings Goals
- Module 19: Recurring Loans

The goal of the audit was to raise these modules to a production-ready baseline consistent with the security, audit, idempotency, and operational controls defined in Modules 15 and 16.

## Key Changes

### Module 17: Bank Accounts & Fund Management

- Clarified that `bank_accounts` are internal LendQ ledger accounts, not direct external-bank integrations.
- Reframed manual deposits and withdrawals as finance-controlled operations rather than generic admin actions.
- Added a compensating reversal endpoint so correction flows remain immutable and auditable.
- Added stronger authorization requirements, structured reason codes, and dual-control language for policy-defined high-value adjustments.
- Expanded the ledger model to include account versioning, transaction balance-before and balance-after snapshots, idempotency metadata, and recurring-deposit failure tracking.
- Hardened recurring deposit processing with `FOR UPDATE SKIP LOCKED`, due-date deduplication, failure states, and explicit operator-visible failure handling.

### Module 18: Savings Goals

- Reworked the design from a one-way contribution tracker into a paired reserve-ledger model backed by Module 17.
- Replaced destructive `DELETE` semantics with explicit soft-cancel behavior.
- Added a release flow so reserved funds can move safely back to an eligible bank account without requiring out-of-band correction.
- Expanded the model from contribution-only history to immutable goal ledger entries covering contributions, releases, and corrections.
- Added ownership, currency-matching, audit, and optimistic-concurrency requirements.
- Defined clearer state rules so completion can be reached and, if funds are later released, safely reverted to `IN_PROGRESS`.

### Module 19: Recurring Loans

- Closed the largest design risk by requiring borrower approval before a recurring loan can become active.
- Added immutable template-versioning and consent records so approval is tied to an exact set of terms.
- Introduced explicit draft, pending approval, active, paused, suspended, completed, and cancelled lifecycle states.
- Added worker-side policy revalidation before generation, including consent validity, party status, exposure controls, and parallel-loan restrictions.
- Defined failure handling that suspends generation on business-rule failures instead of silently retrying unsafe work.
- Expanded public endpoints to cover submit-for-approval, approve, and reject flows.

## Diagram Updates

The following PlantUML sources were updated and re-rendered on March 29, 2026:

- `diagrams/plantuml/c4_component_bank_account.puml`
- `diagrams/plantuml/class_bank_account.puml`
- `diagrams/plantuml/seq_deposit.puml`
- `diagrams/plantuml/seq_withdraw.puml`
- `diagrams/plantuml/seq_recurring_deposit.puml`
- `diagrams/plantuml/c4_component_savings.puml`
- `diagrams/plantuml/class_savings.puml`
- `diagrams/plantuml/seq_add_funds_to_goal.puml`
- `diagrams/plantuml/c4_component_recurring_loan.puml`
- `diagrams/plantuml/class_recurring_loan.puml`
- `diagrams/plantuml/seq_generate_recurring_loan.puml`
- `diagrams/plantuml/seq_pause_recurring_loan.puml`

The PlantUML render script was also updated to use `https://www.plantuml.com/plantuml/png/` by default instead of plain HTTP.

## Remaining Follow-Up

- `docs/api/openapi.yaml` has now been updated to include `/api/v1/accounts`, `/api/v1/savings`, and `/api/v1/loans/recurring` contract coverage. Implementation and tests still need to be aligned to the audited contract before the feature set can be considered production-ready.
- No backend or frontend implementation files were changed in this audit. This work updated the design set and rendered documentation only.

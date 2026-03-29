# Module 17: Bank Accounts & Fund Management

**Requirements**: L1-13

## Overview

The bank account module owns user bank accounts, admin-controlled deposits and withdrawals, recurring deposit schedules, and transaction history. Admin users can deposit and withdraw funds on behalf of users. Any user or admin can set up recurring deposits (e.g., allowance, paycheck) into accounts. Recurring deposits are processed by Celery workers on their scheduled dates.

## C4 Component Diagram

![C4 Component - Bank Account](diagrams/rendered/c4_component_bank_account.png)

*Source: [diagrams/plantuml/c4_component_bank_account.puml](diagrams/plantuml/c4_component_bank_account.puml)*

## Class Diagram

![Class Diagram - Bank Account](diagrams/rendered/class_bank_account.png)

*Source: [diagrams/plantuml/class_bank_account.puml](diagrams/plantuml/class_bank_account.puml)*

## Public Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| `GET` | `/api/v1/accounts` | List bank accounts (admin: all, user: own) | Bearer |
| `GET` | `/api/v1/accounts/{accountId}` | Get bank account detail including balance | Bearer |
| `POST` | `/api/v1/accounts/{accountId}/deposit` | Deposit funds into an account | Admin |
| `POST` | `/api/v1/accounts/{accountId}/withdraw` | Withdraw funds from an account | Admin |
| `GET` | `/api/v1/accounts/{accountId}/transactions` | List transaction history with filters | Bearer |
| `POST` | `/api/v1/accounts/{accountId}/recurring-deposits` | Create a recurring deposit schedule | Bearer |
| `GET` | `/api/v1/accounts/{accountId}/recurring-deposits` | List recurring deposit schedules | Bearer |
| `PATCH` | `/api/v1/accounts/{accountId}/recurring-deposits/{depositId}` | Update a recurring deposit | Bearer |
| `POST` | `/api/v1/accounts/{accountId}/recurring-deposits/{depositId}/pause` | Pause a recurring deposit | Bearer |
| `POST` | `/api/v1/accounts/{accountId}/recurring-deposits/{depositId}/resume` | Resume a paused recurring deposit | Bearer |
| `DELETE` | `/api/v1/accounts/{accountId}/recurring-deposits/{depositId}` | Cancel a recurring deposit | Bearer |

All balance-affecting POST routes require `Idempotency-Key`.

## Data Model

| Entity | Purpose |
|---|---|
| `bank_accounts` | User account identity, balance, currency, status |
| `bank_transactions` | Immutable record of deposits, withdrawals, and recurring deposit postings with balance-after snapshot |
| `recurring_deposits` | Scheduled deposit definitions with frequency, amount, start/end dates, and next execution date |

## Posting Rules

1. Deposits and withdrawals create one immutable `bank_transaction`.
2. Withdrawals validate sufficient balance before recording.
3. Each transaction updates the account balance and records the `balance_after` value.
4. Duplicate retries with the same idempotency key return the original result without creating another transaction.

## Recurring Deposit Rules

1. Recurring deposits are defined with amount, frequency (weekly, bi-weekly, monthly), start date, and optional end date.
2. A Celery beat task scans for recurring deposits where `next_deposit_date <= today` and `status = ACTIVE`.
3. Each execution creates a `bank_transaction` of type `RECURRING_DEPOSIT` and advances `next_deposit_date`.
4. If an end date is set and the next date exceeds it, the recurring deposit status transitions to `COMPLETED`.
5. Users can pause, resume, or cancel recurring deposits at any time.

## Sequences

### Deposit

![Sequence - Deposit](diagrams/rendered/seq_deposit.png)

*Source: [diagrams/plantuml/seq_deposit.puml](diagrams/plantuml/seq_deposit.puml)*

### Withdraw

![Sequence - Withdraw](diagrams/rendered/seq_withdraw.png)

*Source: [diagrams/plantuml/seq_withdraw.puml](diagrams/plantuml/seq_withdraw.puml)*

### Recurring Deposit Processing

![Sequence - Recurring Deposit](diagrams/rendered/seq_recurring_deposit.png)

*Source: [diagrams/plantuml/seq_recurring_deposit.puml](diagrams/plantuml/seq_recurring_deposit.puml)*

## Precision Rules

- Currency amounts use fixed-point decimal types.
- Account balance is derived from the initial balance plus the sum of all transaction amounts (credits positive, debits negative).
- Transaction history preserves raw posted amount and formatted display amount.

## Concurrency

- Deposit and withdrawal operations acquire a row-level lock on the account to prevent race conditions on balance updates.
- Recurring deposit processing is idempotent per deposit per date to handle worker retries safely.

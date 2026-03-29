# Module 18: Savings Goals

**Requirements**: L1-14

## Overview

The savings goals module allows users to create goals with a target amount and optional deadline, allocate funds from their bank account toward goals, track progress, and mark goals as complete when the target is reached. Contributions debit the user's bank account and credit the savings goal, maintaining a full contribution history.

## C4 Component Diagram

![C4 Component - Savings](diagrams/rendered/c4_component_savings.png)

*Source: [diagrams/plantuml/c4_component_savings.puml](diagrams/plantuml/c4_component_savings.puml)*

## Class Diagram

![Class Diagram - Savings](diagrams/rendered/class_savings.png)

*Source: [diagrams/plantuml/class_savings.puml](diagrams/plantuml/class_savings.puml)*

## Public Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| `GET` | `/api/v1/savings` | List savings goals for the current user | Bearer |
| `POST` | `/api/v1/savings` | Create a new savings goal | Bearer |
| `GET` | `/api/v1/savings/{goalId}` | Get savings goal detail including progress | Bearer |
| `PATCH` | `/api/v1/savings/{goalId}` | Update goal name, target, deadline, or description | Bearer |
| `DELETE` | `/api/v1/savings/{goalId}` | Cancel a savings goal | Bearer |
| `POST` | `/api/v1/savings/{goalId}/contributions` | Add funds from bank account toward goal | Bearer |
| `GET` | `/api/v1/savings/{goalId}/contributions` | List contribution history | Bearer |

Balance-affecting contribution POST routes require `Idempotency-Key`.

## Data Model

| Entity | Purpose |
|---|---|
| `savings_goals` | Goal identity, target amount, current amount, deadline, status |
| `savings_contributions` | Immutable record of each contribution with amount, source type, linked bank transaction, and running total |

## Goal Rules

1. Each goal has a `target_amount`, optional `deadline`, and tracks `current_amount` as the sum of contributions.
2. Status transitions: `IN_PROGRESS` → `COMPLETED` (when target reached) or `IN_PROGRESS` → `CANCELLED` (user cancels).
3. Completed goals are read-only. Cancelled goals release no funds automatically; reversal is a separate admin action if needed.
4. Goals without a deadline have no automatic expiry.

## Contribution Rules

1. Adding funds validates that the requested amount does not exceed the user's bank account balance.
2. A contribution debits the bank account (creating a `bank_transaction` of type `WITHDRAWAL`) and credits the savings goal in a single database transaction.
3. Each contribution records a `running_total` for display in contribution history.
4. When a contribution causes `current_amount >= target_amount`, the goal status transitions to `COMPLETED` and a `goal_completed` event is emitted.
5. Duplicate retries with the same idempotency key return the original result.

## Sequences

### Add Funds to Goal

![Sequence - Add Funds to Goal](diagrams/rendered/seq_add_funds_to_goal.png)

*Source: [diagrams/plantuml/seq_add_funds_to_goal.puml](diagrams/plantuml/seq_add_funds_to_goal.puml)*

## Precision Rules

- Currency amounts use fixed-point decimal types consistent with the bank account module.
- Progress percentage is calculated as `(current_amount / target_amount) * 100`, rounded to one decimal place for display.

## Concurrency

- Contribution operations acquire a row-level lock on both the bank account and the savings goal to prevent race conditions.
- Goal completion detection is performed within the same transaction as the contribution to avoid missed transitions.

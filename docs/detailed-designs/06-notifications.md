# Module 6: Notifications

**Requirements**: L1-6, L2-6.1, L2-6.2, L2-6.3

## Overview

The Notification module provides in-app notifications and email alerts for payment events, schedule changes, loan modifications, and system messages. Other service modules trigger notifications as side effects of business operations.

## C4 Component Diagram

![C4 Component — Notification](diagrams/rendered/c4_component_notification.png)

*Source: [diagrams/drawio/c4_component_notification.drawio](diagrams/drawio/c4_component_notification.drawio)*

## Class Diagram

![Class Diagram — Notification](diagrams/rendered/class_notification.png)

*Source: [diagrams/plantuml/class_notification.puml](diagrams/plantuml/class_notification.puml)*

## REST API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/notifications` | List notifications (paginated, filterable) | Bearer |
| GET | `/api/v1/notifications/count` | Get unread count | Bearer |
| PUT | `/api/v1/notifications/{id}/read` | Mark single as read | Bearer |
| PUT | `/api/v1/notifications/read-all` | Mark all as read | Bearer |

## Sequence Diagram

### Notification Operations

![Sequence — Notifications](diagrams/rendered/seq_notifications.png)

*Source: [diagrams/plantuml/seq_notifications.puml](diagrams/plantuml/seq_notifications.puml)*

**Behavior**:
1. **Unread Count**: Called frequently (e.g., on page load, polling) to update the bell icon badge.
2. **List Notifications**: Paginated, filterable by type (PAYMENT_DUE, PAYMENT_OVERDUE, PAYMENT_RECEIVED, SCHEDULE_CHANGED, LOAN_MODIFIED, SYSTEM). Results are grouped by date for the full notifications page.
3. **Mark Read**: Updates `is_read=true` for individual or all notifications.

## Notification Triggers

| Event | Notification Type | Recipients | Email |
|-------|------------------|------------|-------|
| Payment due in 3 days | PAYMENT_DUE | Borrower | Yes |
| Payment overdue | PAYMENT_OVERDUE | Both | Yes |
| Payment recorded | PAYMENT_RECEIVED | Creditor | Yes |
| Payment rescheduled | SCHEDULE_CHANGED | Counterparty | No |
| Payments paused | SCHEDULE_CHANGED | Counterparty | No |
| Loan created | LOAN_MODIFIED | Borrower | Yes |
| Loan terms modified | LOAN_MODIFIED | Counterparty | No |

## Notification Creation Pattern

Notifications are created as side effects within service layer methods. The `NotificationService` is injected into `LoanService` and `PaymentService`. When a business event occurs, the service calls `NotificationService.create_notification()` which:

1. Persists the notification record in the database.
2. For email-eligible notifications, dispatches an email via `EmailService`.
3. The email is sent asynchronously (queued) to avoid blocking the API response.

## Data Model

### Notification Entity

| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK |
| user_id | UUID | FK -> users.id, NOT NULL |
| type | VARCHAR(30) | NOT NULL |
| message | VARCHAR(500) | NOT NULL |
| loan_id | UUID | FK -> loans.id |
| is_read | BOOLEAN | DEFAULT FALSE |
| created_at | TIMESTAMP | NOT NULL |

### Scheduled Notifications

A background task (Flask-APScheduler or Celery beat) runs daily to:
1. Detect payments due in 3 days and create PAYMENT_DUE notifications.
2. Detect payments past their due date and create PAYMENT_OVERDUE notifications.
3. Update loan status to OVERDUE for loans with overdue payments.

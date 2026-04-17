# Glossary

Terms used across the LendQ app, with links to the sections where they're explained in depth.

### Access token

The short-lived JWT that authorizes API requests. Paired with a longer-lived refresh token. When the access token expires, the client silently refreshes it; if the refresh fails you're kicked to the sign-in page.

### Admin

A user with the `Admin` role. Can access [User Management](11-admin-users.md), [Role Management](12-admin-roles.md), and [Admin Bank Accounts](13-admin-bank-accounts.md).

### Audit trail

The immutable record of who changed what and when. LendQ preserves terms versions, schedule versions, and notification history rather than deleting.

### Bank account (LendQ)

An in-app ledger for a user. Not an external bank. See [Bank Account](07-bank-account.md).

### Beat (Celery Beat)

The scheduler process that triggers recurring jobs (due-date scans, notification scans, recurring deposit generation).

### Borrower

A user who receives money on a loan. Can record payments but cannot edit loan terms.

### Change request

A borrower-initiated proposal to modify a loan's terms. The creditor sees it on the loan detail page and can approve or decline.

### Container App

Azure's managed serverless container runtime. LendQ's API, worker, and beat each run as a Container App in the staging environment.

### Creditor

A user who lends money on a loan. Can create and edit loans, record payments.

### Idempotency key

A unique identifier sent with mutating requests so duplicates are safely ignored. LendQ uses idempotency keys on payment recording and savings contributions.

### Loan

The core unit of money owed. Has terms (principal, rate, frequency), a generated payment schedule, and a status. See [Loans](04-loans.md).

### Orphan account

A bank account whose owning user was deleted. Visible only in the [Admin Bank Accounts](13-admin-bank-accounts.md) list with the `Orphan` filter.

### Payment

A specific unit of money movement against a loan. Can be `SCHEDULED` (not yet due), `PAID`, `PARTIALLY_PAID`, `OVERDUE`, `PAUSED`, or `RESCHEDULED`. See [Payments](05-payments.md).

### Preview environment

A per-pull-request frontend instance deployed automatically by Azure Static Web Apps. See [Deployment](14-deployment.md).

### Principal

The amount of money lent at loan inception, before interest.

### Recurring loan

A template that generates a real loan on a fixed cadence. See [Recurring Loans](06-recurring-loans.md).

### Refresh token

A longer-lived credential used to obtain a new access token. Revoked on sign-out or when **Sign out everywhere** is used.

### Request ID

The `X-Request-ID` header attached to every API response, used to correlate browser errors with backend logs. Include it in bug reports.

### Revision (Container App)

A deployed version of a Container App. `az containerapp revision` lists them; rollback means activating a previous revision.

### Role

A named collection of permissions. Users hold one or more roles. Defaults: `Admin`, `Creditor`, `Borrower`. See [Role Management](12-admin-roles.md).

### Savings goal

A named target amount with contribution history. Funded from the user's bank account. See [Savings Goals](08-savings-goals.md).

### Schedule

The ordered list of payments a loan will generate. Each payment has a due date, an expected amount, and a status.

### SSE (Server-Sent Events)

The one-way push stream used to deliver notifications to the browser in real time. The notification bell's unread count updates over this stream.

### Terms version

A snapshot of a loan's terms (principal, rate, frequency, notes) at a point in time. A new version is created each time a creditor edits the loan, preserving history.

### Toast

A transient notification that slides in from the corner and disappears after 5 seconds. See [Notifications › Toast messages](09-notifications.md#toast-messages).

### Worker (Celery worker)

The background process that handles async jobs — sending emails, generating loan schedules, etc. Runs as a separate Container App.

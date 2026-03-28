# LendQ Backend Implementation Audit

Date: 2026-03-27

## Scope

Implementation reviewed:

- `backend/app/`
- `backend/tests/`

Reference baseline:

- `docs/specs/L1.md`
- `docs/specs/L2.md`
- `docs/api/openapi.yaml`
- `docs/detailed-designs/01-authentication.md`
- `docs/detailed-designs/02-user-management.md`
- `docs/detailed-designs/03-loan-management.md`
- `docs/detailed-designs/04-payment-tracking.md`
- `docs/detailed-designs/05-dashboard.md`
- `docs/detailed-designs/06-notifications.md`
- `docs/detailed-designs/15-security-session-architecture.md`
- `docs/detailed-designs/16-operational-readiness-and-api-governance.md`

## Audit Method

This audit was performed by static review of the backend code and tests. Automated backend tests were not executed successfully in this environment because the local Python toolchain could not install all required native dependencies:

- `psycopg2-binary` install failed because `pg_config` is not available
- `bcrypt` install failed because a Rust toolchain is not available

That means the findings below are based on implementation inspection rather than a passing or failing runtime validation pass.

## Executive Summary

The backend implementation still reflects the older pre-remediation design, not the current detailed design set.

The largest gaps are:

1. authentication and session handling still use body-returned refresh tokens instead of the secure cookie and session-inventory architecture
2. payment and schedule logic still mutate installment rows directly instead of using an immutable transaction and allocation ledger
3. payment endpoints do not enforce loan-participant authorization, which is an immediate security defect
4. loan governance, notification delivery, API surface, and operational controls remain materially behind the documented target architecture

Verdict: the backend is not aligned with the current design baseline and is not yet implementation-ready for the production-target requirements.

## Priority Findings

| Severity | Area | Summary |
|---|---|---|
| Critical | Auth and sessions | Implementation still returns refresh tokens in JSON, lacks email verification, lacks session inventory, and does not implement the documented secure session model |
| Critical | Payment authorization | Any authenticated user can access and mutate payment and schedule resources if they know the identifiers |
| Critical | Financial integrity | Money movement is modeled as mutation of schedule rows, with no immutable transactions, allocations, reversals, or durable idempotency |
| High | Loan governance | Loan terms model is missing currency, maturity strategy, versions, and borrower change-request flow; borrowers can still edit most terms directly |
| High | API contract | Implemented endpoints and methods diverge broadly from `docs/api/openapi.yaml` |
| High | Notifications | No SSE stream, no preference APIs, no delivery-state model, no outbox, and no worker-based delivery pipeline |
| High | Operational readiness | Rate limiting and idempotency are in-memory only, health checks are shallow, metrics middleware is not wired, and Celery is not actually integrated |
| Medium | Error and audit semantics | Public error envelope and security audit coverage do not match the design baseline |
| Medium | Test coverage alignment | Backend tests still assert the obsolete contract, so the test suite is not protecting the current design requirements |

## Detailed Discrepancies

### 1. Authentication and session handling are still on the obsolete token-body model

Expected:

- `L2-1.4`, `L2-8.1`
- `docs/detailed-designs/01-authentication.md`
- `docs/detailed-designs/15-security-session-architecture.md`

Actual implementation:

- auth routes only expose login, signup, forgot-password, reset-password, refresh, and logout in `backend/app/controllers/auth_controller.py:28-91`
- login returns both access and refresh tokens in the JSON body in `backend/app/controllers/auth_controller.py:30-34` and `backend/app/services/token_service.py:79-87`
- refresh requires `refresh_token` in the request body in `backend/app/controllers/auth_controller.py:78-83` and `backend/app/schemas/auth_schemas.py:24-26`
- logout optionally revokes a refresh token supplied in the request body in `backend/app/controllers/auth_controller.py:86-91`
- there is no `/api/v1/auth/me`, `/api/v1/auth/email-verification/resend`, `/api/v1/auth/email-verification/confirm`, `/api/v1/auth/logout-all`, `/api/v1/auth/sessions`, or `/api/v1/auth/sessions/{sessionId}`
- `User` has no `email_verified_at` or `session_version` fields in `backend/app/models/user.py:28-52`
- access tokens carry only `sub`, `email`, `name`, and `roles` in `backend/app/services/token_service.py:20-36`
- auth middleware only validates bearer token signature and active user state in `backend/app/middleware/auth_middleware.py:30-49`
- password hashing still uses bcrypt in `backend/app/services/password_service.py:1-12`, not the documented Argon2id baseline

Impact:

- the implementation does not satisfy the secure client token storage and server-side session model in the detailed design
- there is no documented or implemented way to inventory or revoke sessions by device
- there is no email verification enforcement
- there is no CSRF-protected refresh-cookie flow

### 2. Payment and schedule endpoints are missing resource authorization checks

Expected:

- `L1-4`, `L1-8`
- only loan participants with the right role should be able to view schedule/history or mutate payments

Actual implementation:

- payment controller routes use `@require_auth` only in `backend/app/controllers/payment_controller.py:23-64`
- `PaymentService.get_schedule` returns a loan schedule without checking the current user in `backend/app/services/payment_service.py:26-27`
- `record_payment` loads the loan and records payment without checking creditor, borrower, or admin ownership in `backend/app/services/payment_service.py:29-81`
- `reschedule_payment` mutates a payment without verifying the caller belongs to the loan in `backend/app/services/payment_service.py:83-117`
- `pause_payments` mutates payments without verifying the caller belongs to the loan in `backend/app/services/payment_service.py:119-151`
- `get_history` returns change log history without access control in `backend/app/services/payment_service.py:153-156`

Impact:

- any authenticated user can attempt to read or mutate another user's loan schedule and payments if they learn IDs
- this is a direct security defect, not just a design mismatch

### 3. Financial-integrity implementation does not match the immutable ledger design

Expected:

- `L1-4`, `L1-9`
- `L2-4.6`, `L2-4.7`, `L2-9.1`, `L2-9.3`, `L2-9.4`
- `docs/detailed-designs/04-payment-tracking.md`

Actual implementation:

- money state lives on mutable `payments` schedule rows in `backend/app/models/payment.py:16-36`
- `record_payment` directly updates `amount_paid`, `status`, `paid_date`, and `notes` on schedule rows in `backend/app/services/payment_service.py:49-66`
- there is no `payment_transactions` table, no `payment_allocations` table, and no transaction identifier returned to clients
- the record-payment endpoint returns only `{"message": "Payment recorded"}` in `backend/app/controllers/payment_controller.py:31-38`
- there is no reversal endpoint
- there is no durable schedule version model; reschedule only mutates `due_date` plus `original_due_date` in `backend/app/services/payment_service.py:91-96`
- outstanding balance is derived from mutable schedule rows in `backend/app/services/balance_service.py:10-15`
- idempotency is implemented as an in-memory process-local dictionary in `backend/app/middleware/idempotency.py:10-44`

Impact:

- the system cannot provide authoritative, replay-safe, auditable money movement
- multi-instance deployment would break idempotency guarantees
- reversals and corrected balances are not implementable without destructive mutation

### 4. Loan model and governance are materially behind the detailed design

Expected:

- `L1-3`, `L1-9`
- `L2-3.3`, `L2-3.5`, `L2-9.2`, `L2-9.3`
- `docs/detailed-designs/03-loan-management.md`

Actual implementation:

- `Loan` stores only `principal`, `interest_rate`, `repayment_frequency`, `start_date`, `status`, and `notes` in `backend/app/models/loan.py:22-51`
- there is no `currency`, `installment_count`, `maturity_date`, `custom_schedule`, `current_terms_version`, or `current_schedule_version`
- request schema still requires `num_payments` rather than the new maturity strategy in `backend/app/schemas/loan_schemas.py:27-40`
- schedule generation depends on `loan._num_payments`, which is a transient attribute, not persisted state, in `backend/app/services/loan_service.py:70-73` and `backend/app/services/schedule_service.py:11-17`
- borrower edits are still allowed for every field except principal in `backend/app/services/loan_service.py:91-103`
- there are no terms-version endpoints, no borrower change-request endpoints, and no approval workflow in `backend/app/controllers/loan_controller.py:15-53`
- there is no optimistic concurrency such as `expected_terms_version`

Impact:

- contractual loan terms cannot be versioned or audited as required
- borrower term governance is still the outdated "principal only is locked" rule
- the model cannot support the documented custom schedule or maturity-date contract

### 5. The implemented API surface diverges broadly from the published contract

Expected:

- `docs/api/openapi.yaml`
- `L1-12`, `L2-12.1`, `L2-12.2`, `L2-12.3`

Key mismatches:

- missing auth endpoints: `/api/v1/auth/me`, `/api/v1/auth/email-verification/resend`, `/api/v1/auth/email-verification/confirm`, `/api/v1/auth/logout-all`, `/api/v1/auth/sessions`, `/api/v1/auth/sessions/{sessionId}`
- missing user and audit endpoints: `/api/v1/users/borrowers`, `/api/v1/admin/audit-events`
- missing loan governance endpoints: `/api/v1/loans/{loanId}/terms-versions`, `/api/v1/loans/{loanId}/change-requests`, approve and reject actions
- missing payment endpoints: `GET /api/v1/loans/{loanId}/payments`, `POST /api/v1/payments/{paymentId}/reversals`, schedule-adjustment routes
- missing notification endpoints: `/api/v1/notifications/unread-count`, `/api/v1/notifications/stream`, `/api/v1/notification-preferences`
- method mismatches:
  - `PUT /api/v1/users/{id}` is implemented instead of `PATCH`
  - `PUT /api/v1/roles/{roleId}/permissions` is implemented instead of `/roles/{roleKey}/permissions`
  - `GET /api/v1/notifications/count` is implemented instead of `/notifications/unread-count`
  - `PUT` is used for notification read actions instead of `POST`

Evidence:

- route list in `backend/app/controllers/*.py`
- tests asserting old contract in `backend/tests/integration/test_auth_endpoints.py:7-69`, `backend/tests/integration/test_loan_endpoints.py:5-48`, `backend/tests/integration/test_notification_endpoints.py:5-33`, and `backend/tests/integration/test_payment_endpoints.py:4-39`

Impact:

- the frontend and any generated clients from the current OpenAPI contract will not integrate with the implemented backend

### 6. Notification implementation is still the old polling-era design

Expected:

- `L1-6`, `L1-11`
- `L2-6.2`, `L2-6.4`, `L2-6.5`, `L2-11.1`
- `docs/detailed-designs/06-notifications.md`

Actual implementation:

- notification API exposes only list, unread count, mark-read, and mark-all-read in `backend/app/controllers/notification_controller.py:13-51`
- unread count route is `/count`, matching the deprecated polling design
- there is no SSE stream endpoint
- there are no preference endpoints even though `notification_preferences` exists as a table in `backend/app/models/notification_preference.py:4-13`
- `Notification` has only `type`, `message`, `loan_id`, and `is_read` in `backend/app/models/notification.py:16-32`; there is no delivery status, channel, or dedupe key
- `NotificationService.create_notification` writes directly to the notifications table and uses only a coarse 24-hour duplicate check by user, type, and loan in `backend/app/services/notification_service.py:33-48`
- reminder jobs are plain functions that directly send email and ignore saved preferences in `backend/app/jobs/payment_reminder.py:11-35`
- there is no transactional outbox and no Celery integration in the application code

Impact:

- notification delivery is not trackable or retryable in the documented way
- optional email preferences are not enforceable
- active-session near-real-time delivery is not implemented

### 7. Operational readiness is incomplete and not aligned to the production design

Expected:

- `L1-11`
- `docs/detailed-designs/15-security-session-architecture.md`
- `docs/detailed-designs/16-operational-readiness-and-api-governance.md`

Actual implementation:

- Flask-Limiter uses in-memory storage in `backend/app/extensions.py:12-16`, which is not safe for multi-instance production throttling
- idempotency storage is also process-local memory in `backend/app/middleware/idempotency.py:10-44`
- health readiness only checks the database in `backend/app/observability/health.py:13-27`; it does not check Redis, scheduler state, or migration state
- metrics middleware exists but is never initialized in `backend/app/observability/metrics.py:9-28` and `backend/app/__init__.py:26-60`
- Celery and Redis are present in requirements, but there is no Celery app, task wiring, or queue publishing in the backend code
- configuration still defaults security-sensitive secrets to `"change-me"` in `backend/app/config.py:5-10`

Impact:

- the runtime is not aligned to the documented multi-instance, worker-based production model
- throttling and idempotency guarantees will fail under scale-out or process restart conditions

### 8. Error envelope and audit coverage diverge from the current contract

Expected:

- `L2-8.4`, `L2-12.2`
- public errors should include `code`, `message`, and `request_id`
- sensitive auth and security events should be audited consistently

Actual implementation:

- error handlers return `error` and `code`, not `message` and `request_id`, in `backend/app/errors/handlers.py:11-48`
- request IDs are generated in middleware, but not included in error bodies
- audit logging is present for some user and loan mutations, but auth events such as login success, login failure, refresh, logout, and forgot-password are not written through `AuditService`
- loan and payment history use separate models (`audit_logs`, `change_logs`) rather than the unified audit/event model described in the design

Impact:

- client error handling is not aligned to the published contract
- security-event audit coverage is incomplete

### 9. Backend tests still lock in the obsolete contract

Evidence:

- auth tests expect login to return `refresh_token` and refresh to accept `refresh_token` in the body in `backend/tests/integration/test_auth_endpoints.py:7-69`
- loan tests still create loans with `num_payments` and no currency or maturity strategy in `backend/tests/integration/test_loan_endpoints.py:5-48`
- notification tests still target `/api/v1/notifications/count` in `backend/tests/integration/test_notification_endpoints.py:19-24`
- payment tests assert the old schedule-row endpoints only in `backend/tests/integration/test_payment_endpoints.py:18-39`

Impact:

- even a green backend test suite would not prove compliance with the current detailed design or requirements

## Partial Alignment

The backend is not empty. Several elements partially support the target architecture:

- request ID propagation exists in `backend/app/middleware/request_id.py`
- basic security headers exist in `backend/app/middleware/security_headers.py`
- audit and change-log tables exist
- refresh tokens are hashed at rest
- health endpoints exist

These are useful building blocks, but they do not close the major design gaps listed above.

## Recommended Next Steps

1. Rebuild auth first around the current session design: cookie-backed refresh, `/auth/me`, email verification, session inventory, CSRF, and session-version invalidation.
2. Lock down payment and schedule endpoints immediately by enforcing loan-participant authorization on every read and write path.
3. Replace the mutable `payments` model with immutable payment transactions, allocations, reversals, and durable idempotency.
4. Redesign the loan aggregate to include terms versions, schedule versions, and borrower change requests.
5. Implement the published API contract or version it honestly before frontend integration continues.
6. Introduce the real notification pipeline: outbox, worker delivery, SSE, delivery status, and preferences.
7. Upgrade operational controls: Redis-backed rate limiting, durable idempotency storage, readiness checks beyond the database, metrics wiring, and real worker integration.
8. Rewrite backend tests to target the current contract and the new financial and security invariants.

## Bottom Line

The backend implementation is materially behind the detailed design and requirements. The largest problems are not cosmetic naming mismatches. They are concentrated in session security, payment authorization, financial integrity, contract compatibility, and production-operability, which are the highest-risk areas in this system.

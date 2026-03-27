# LendQ Detailed Design Review

Date: 2026-03-27

## Scope

Artifacts reviewed:

- `docs/specs/L1.md`
- `docs/specs/L2.md`
- `docs/detailed-designs/00-index.md`
- `docs/detailed-designs/01-authentication.md`
- `docs/detailed-designs/02-user-management.md`
- `docs/detailed-designs/03-loan-management.md`
- `docs/detailed-designs/04-payment-tracking.md`
- `docs/detailed-designs/05-dashboard.md`
- `docs/detailed-designs/06-notifications.md`
- supporting PlantUML and Draw.io diagrams under `docs/detailed-designs/diagrams/`
- visual design artifact `docs/ui-design.pen`

## Executive Summary

The current design is a credible first pass, but it is not yet sufficient for a secure, high-performance, production-ready implementation.

The strongest parts are the module decomposition, the baseline stack choice (React SPA, Flask, SQLAlchemy, PostgreSQL), the use of diagrams, and the early inclusion of core security basics such as password hashing, hashed reset tokens, hashed refresh-token storage, soft deletes, and audit/change tracking.

The main blockers are:

1. The design set is still backend-heavy and does not translate the UI-centric L2 requirements into a frontend technical architecture.
2. The auth/session model is not production-safe enough for a React SPA handling financial data.
3. The loan/payment data model is too weak for auditable financial accounting, partial payments, prepayments, and schedule changes.
4. Multi-step workflows do not define transaction boundaries, idempotency, concurrency control, or reliable event delivery.
5. The async/notification architecture is underspecified for a multi-instance production deployment.
6. Observability, deployment, recovery, testing, and operational readiness are largely absent from the design.

Verdict: do not start implementation against this design as-is. Tighten the architecture first, especially around auth, payment accounting, consistency, and frontend/API contract definition.

## Requirement Coverage Summary

Status legend:

- `Covered`: materially addressed
- `Partial`: addressed, but important implementation gaps remain
- `At Risk`: design exists, but likely to fail requirements or production-readiness goals without redesign
- `Missing`: not materially designed

| Requirement Area | Status | Notes |
|---|---|---|
| L1-1 Authentication & Login | Partial | Core backend flows exist, but the design uses email-only login while L1 states email/username, and there is no production-grade SPA session-storage strategy. |
| L1-2 User Management & RBAC | Partial | CRUD and multi-role support are documented, but permission governance, revocation behavior, and admin audit controls are underdefined. |
| L1-3 Loan Management | At Risk | CRUD exists, but the loan model is missing key schedule/term attributes and allows overly broad borrower updates. |
| L1-4 Payment Tracking & Scheduling | At Risk | Workflow coverage exists, but the payment model cannot support robust reconciliation, partial payments, or idempotent money movement. |
| L1-5 Dashboard & Overview | Partial | Endpoints and aggregates are defined, but scale/read-model strategy is missing and the balance source of truth is inconsistent. |
| L1-6 Notifications & Alerts | Partial | Notification triggers exist, but real-time delivery, dedupe, retry, worker topology, and delivery-state tracking are not fully designed. |
| L1-7 Responsive Design | Missing from technical design | Visual design assets exist in `docs/ui-design.pen`, but there is no frontend technical design for responsive routing, auth guards, state, accessibility, or performance. |

## Priority Findings

| Severity | Finding | Why It Matters |
|---|---|---|
| Critical | No end-to-end frontend technical design tied to the L2 requirements | Most L2 requirements are screen, navigation, dialog, and responsive behaviors; the design set is explicitly backend-oriented and leaves implementation-critical frontend decisions open. |
| Critical | SPA auth/session design is not production-safe as written | Returning bearer tokens to a React SPA without a documented storage and rotation strategy creates avoidable token theft and replay risk. |
| Critical | Payment accounting model is not auditable enough | A mutable `Payment` row is not a sufficient ledger for partial payments, lump sums, chargeback/reversal scenarios, or reconciliation. |
| Critical | Multi-write business workflows lack transaction/outbox/idempotency design | Loan creation, payment recording, schedule updates, activity creation, and notifications can diverge under retries, concurrency, or partial failure. |
| High | Loan schedule generation is underspecified and inconsistent with requirements | Required frequencies and custom schedules cannot be derived from the current loan fields and algorithm. |
| High | Authorization revocation and permission governance are too weak | Role changes take effect on next token refresh; critical access can remain live after revocation or deactivation. |
| High | Async job architecture is unresolved for production | APScheduler inside the app and a vague "or Celery beat" choice is not a reliable multi-instance production strategy. |
| Medium | Dashboard and notification reads will become hot paths | Frequent polling and aggregate queries can overload PostgreSQL without read-model/index/caching strategy. |
| Medium | Error handling leaks internals | Returning `str(error)` and exception class names is unsafe in production and will expose internals to clients. |
| Medium | Operational readiness is missing | No concrete design exists for deployment, observability, recovery, CI/CD, security scanning, or performance testing. |

## Detailed Feedback

### 1. Requirements Traceability And Frontend Architecture

The highest-level mismatch is that the requirements are heavily UI-centric while the top-level design document is explicitly backend-oriented. `docs/detailed-designs/00-index.md:1` labels the set as "Backend Detailed Design Documentation", while `docs/specs/L2.md` is dominated by screen, layout, responsive, navigation, toast, and dialog behaviors.

This means the current design does not yet explain how the product will actually satisfy:

- responsive navigation and breakpoints (`docs/specs/L2.md:224-249`)
- screen-level flows for login, users, loans, notifications, dialogs, and toasts (`docs/specs/L2.md:7-220`)
- form validation states, error handling, loading states, and disabled states
- route protection and role-based rendering in the React SPA
- accessibility requirements such as keyboard behavior, focus management, screen-reader labels, and modal semantics
- frontend performance concerns such as code splitting, asset budgets, data prefetching, caching, and hydration strategy

The presence of `docs/ui-design.pen` is useful, but it is a visual artifact, not a frontend implementation design.

Recommendation:

1. Add a dedicated frontend technical design document for the React SPA.
2. Map every L2 screen/dialog/navigation requirement to routes, components, API contracts, and state transitions.
3. Define route guards, auth bootstrap flow, token refresh behavior, caching, optimistic updates, validation, accessibility, and responsive implementation rules.
4. Standardize on TypeScript, a generated API client from OpenAPI, route-level code splitting, and a data-fetching layer such as TanStack Query or an equivalent pattern.

### 2. Authentication, Session, And Security Design

The auth design has good baseline instincts:

- bcrypt hashing (`docs/detailed-designs/01-authentication.md:110`)
- hashed refresh tokens for revocation (`docs/detailed-designs/01-authentication.md:45`)
- hashed reset tokens (`docs/detailed-designs/01-authentication.md:71-74`)
- generic auth failures to avoid enumeration (`docs/detailed-designs/01-authentication.md:46`, `docs/detailed-designs/01-authentication.md:114`)

The production gaps are still material:

1. The design standardizes on bearer JWTs in the `Authorization` header (`docs/detailed-designs/00-index.md:51-53`) and shows a React SPA in front of the API (`docs/detailed-designs/diagrams/plantuml/c4_container.puml:11-24`), but it never defines where tokens live in the browser.
2. The login response returns both access and refresh tokens directly to the SPA (`docs/detailed-designs/01-authentication.md:88-95`). If those end up in `localStorage` or `sessionStorage`, the system becomes highly exposed to XSS-driven token theft.
3. JWT signing uses HS256 and a shared secret (`docs/detailed-designs/01-authentication.md:111`). For production, prefer asymmetric signing such as RS256 or EdDSA with `kid`, rotation policy, and issuer/audience validation.
4. The design does not define refresh-token rotation, token family tracking, reuse detection, device/session inventory, or forced logout semantics across devices.
5. Rate limiting is only described as 5 attempts per minute per IP (`docs/detailed-designs/01-authentication.md:115`). That is too weak on its own for credential stuffing and will also create false positives behind NAT.
6. Signup is not clearly protected by verification or anti-abuse controls.
7. There is no documented MFA option, email verification flow, CORS policy, CSP, secure headers, TLS posture, or secrets management approach.

Recommendation:

1. Choose one of two explicit patterns and document it:
   - preferred: secure `httpOnly`, `SameSite`, short-lived session/refresh cookies with CSRF protection
   - acceptable: in-memory access token plus rotating refresh token in secure cookie, with strict CSP and replay detection
2. Add token rotation with reuse detection and token family invalidation.
3. Introduce `iss`, `aud`, `jti`, `iat`, `nbf`, and key-rotation metadata.
4. Add per-account and per-IP rate limits, progressive backoff, and optional CAPTCHA after threshold breaches.
5. Define email verification and password policy.
6. Add structured audit logs for login, reset, logout, role changes, and suspicious activity.

### 3. Error Handling Needs Production Hardening

The global error handler currently returns `str(error)` and the exception class name directly to clients (`docs/detailed-designs/00-index.md:68-77`). That is acceptable for local development, but it is not acceptable for production.

Risks:

- leakage of internal exception messages, stack-adjacent data, and implementation details
- inconsistent client behavior when raw exception strings vary
- accidental disclosure of SQL, filesystem, or third-party error details

Recommendation:

1. Split exception handling into domain errors, validation errors, authz/authn errors, and unexpected faults.
2. Return stable public error codes and user-safe messages only.
3. Log the full exception server-side with request ID and trace context.
4. Include correlation IDs in client responses.

### 4. Loan Domain Model Is Incomplete For The Required Scheduling Rules

The loan model currently includes `principal`, `interest_rate`, `repayment_frequency`, and `start_date`, but it does not define the number of installments, maturity date, custom schedule payload, currency, grace-period rules, or a canonical outstanding-balance strategy (`docs/detailed-designs/03-loan-management.md:72-85`, `docs/detailed-designs/diagrams/plantuml/class_loan.puml:27-55`).

This becomes a real problem because the schedule algorithm assumes a value `n` for number of payments (`docs/detailed-designs/03-loan-management.md:89-92`), but that input does not exist in the documented model or create-loan API.

There is also a requirements mismatch:

- L1 says `weekly, monthly, custom` (`docs/specs/L1.md:10`)
- L2 says `Weekly, Bi-weekly, Monthly, Custom` (`docs/specs/L2.md:99`)
- the algorithm shown is monthly amortization only (`docs/detailed-designs/03-loan-management.md:89-92`)

Recommendation:

1. Expand the loan terms model to include:
   - currency
   - installment count or end date
   - repayment frequency enum with exact allowed values
   - optional custom schedule definition
   - accrual/prepayment/rounding policy
2. Decide whether `outstanding_balance` is stored, derived, or both.
3. Define a schedule-versioning model so edits do not destroy historical meaning.
4. Resolve the frequency mismatch before implementation.

### 5. Borrower Update Rules Are Too Broad For A Financial Product

The design says borrowers can update everything except principal (`docs/specs/L1.md:10`, `docs/detailed-designs/03-loan-management.md:52-55`, `docs/detailed-designs/diagrams/plantuml/seq_update_loan.puml:24-33`).

Technically that matches the stated requirement, but it is not a safe production rule without stronger domain controls. Under that rule a borrower could potentially alter:

- interest rate
- repayment frequency
- start date
- notes or descriptive terms with contractual meaning

That is unusual for a lending system and creates legal, operational, and audit problems.

Recommendation:

1. Revisit the requirement and define a field-level permission matrix.
2. Prefer a workflow where borrower-requested changes are proposals requiring creditor approval.
3. Version loan terms and schedules rather than silently mutating active contracts.

### 6. Payment Accounting Model Is Not Sufficiently Auditable

This is the single biggest domain issue in the design.

The documented `Payment` entity is a mutable schedule row with `amount_due`, `amount_paid`, `due_date`, `paid_date`, `status`, and `notes` (`docs/detailed-designs/04-payment-tracking.md:91-102`, `docs/detailed-designs/diagrams/plantuml/class_payment.puml:35-46`). The payment-recording flow then updates the "next due" payment and may apply excess to future payments (`docs/detailed-designs/04-payment-tracking.md:39-46`, `docs/detailed-designs/diagrams/plantuml/seq_record_payment.puml:21-41`).

That is not a strong enough model for production finance workflows because it does not separate:

- scheduled obligations
- actual payment transactions
- allocation of a transaction across one or more scheduled installments
- reversals/refunds/corrections
- payment method metadata
- external processor references

It also conflicts with L2-4.4, which calls for payment method capture and a balance preview (`docs/specs/L2.md:148-155`), while the backend design only models amount/date/notes (`docs/detailed-designs/04-payment-tracking.md:39-46`).

Recommendation:

1. Split the model into at least:
   - `payment_schedule_items`
   - `payment_transactions`
   - `payment_allocations`
2. Make transactions immutable.
3. Add idempotency keys for payment creation.
4. Store payment method, external reference, initiated-by, source, and reversal linkage.
5. Treat balance as a derived financial position from allocations, not as an informal side effect.

### 7. Transaction Boundaries, Concurrency Control, And Idempotency Are Missing

Several core flows perform multiple writes and side effects but do not define atomicity or retry safety:

- create loan: save loan, generate schedule, persist payments, notify borrower (`docs/detailed-designs/diagrams/plantuml/seq_create_loan.puml:22-32`)
- update loan: save change log, save loan, notify counterparty (`docs/detailed-designs/diagrams/plantuml/seq_update_loan.puml:29-33`)
- record payment: find next due, mutate schedule, update loan balance/status, save change log, notify (`docs/detailed-designs/diagrams/plantuml/seq_record_payment.puml:21-40`)
- pause payments: loop through rows, update each, save change logs, notify (`docs/detailed-designs/diagrams/plantuml/seq_pause_payment.puml:20-31`)

Without defined transaction boundaries and concurrency controls, the system is exposed to:

- double payment application on retries
- stale reads on concurrent payment submissions
- partial data writes
- notifications/activity written when the main transaction failed, or vice versa

Recommendation:

1. Wrap domain writes in explicit database transactions.
2. Use row locking or optimistic locking for hot financial records.
3. Require idempotency keys on money-moving or create-style POST endpoints.
4. Use the outbox pattern for notifications and activity events rather than synchronous side effects from service methods.

### 8. Notification And Background Job Design Needs A Concrete Production Topology

The notification design correctly identifies asynchronous delivery as necessary (`docs/detailed-designs/06-notifications.md:57-61`), but the system topology does not yet define how that happens.

The problems:

1. The container diagram shows API, Auth, Notification, PostgreSQL, and SMTP, but no queue, broker, or worker runtime (`docs/detailed-designs/diagrams/plantuml/c4_container.puml:10-25`).
2. The scheduled job design says "Flask-APScheduler or Celery beat" (`docs/detailed-designs/06-notifications.md:79-82`). That is not a finished design decision.
3. Real-time UI requirements call for toast notifications for real-time events (`docs/specs/L2.md:206-212`), but the backend design only documents polling for unread count (`docs/detailed-designs/06-notifications.md:38-41`, `docs/detailed-designs/diagrams/plantuml/seq_notifications.puml:15-42`).
4. The `Notification` entity lacks delivery status, channel, retries, dedupe key, last-attempt timestamp, and provider message ID (`docs/detailed-designs/06-notifications.md:67-75`, `docs/detailed-designs/diagrams/plantuml/class_notification.puml:30-60`).

Recommendation:

1. Pick a single production strategy:
   - Celery plus Redis/RabbitMQ
   - or another dedicated worker system, but not in-process APScheduler in web nodes
2. Add an outbox table and worker consumers for email and activity delivery.
3. Decide how "real-time" UI notifications work: SSE, WebSocket, or acceptable polling intervals.
4. Add delivery-state tracking, retry policy, and dedupe semantics.

### 9. Dashboard Read Paths Need Scale Planning

The dashboard sequence aggregates multiple queries in series (`docs/detailed-designs/diagrams/plantuml/seq_dashboard.puml:21-40`) and the notification design expects frequent badge polling (`docs/detailed-designs/06-notifications.md:39`).

That is manageable for a small system, but it will become a hot path quickly because:

- every authenticated session hits the dashboard
- badge counts are naturally polled often
- activity feeds and aggregated balances are mutable, time-sensitive views

There is also an inconsistency in the balance story:

- dashboard DTOs expect `outstanding_balance` (`docs/detailed-designs/05-dashboard.md:41-46`, `docs/detailed-designs/diagrams/plantuml/class_dashboard.puml:31-38`)
- the loan entity does not document such a field (`docs/detailed-designs/03-loan-management.md:72-85`, `docs/detailed-designs/diagrams/plantuml/class_loan.puml:27-55`)
- payment flow assumes `loan_repo.update_balance(...)` exists (`docs/detailed-designs/diagrams/plantuml/seq_record_payment.puml:31-35`)

Recommendation:

1. Define the authoritative balance computation model.
2. Add concrete index design for loans, payments, notifications, and activity.
3. Consider cached/materialized read models for dashboard aggregates.
4. Prefer cursor pagination for feeds over page/per-page on mutable activity streams.
5. Add ETags or short-lived cache headers where practical.

### 10. RBAC Model Needs Stronger Governance And Revocation Semantics

The user/RBAC design has a sound baseline:

- multi-role users are supported (`docs/detailed-designs/02-user-management.md:72-74`)
- both route-level and service-level checks are planned (`docs/detailed-designs/02-user-management.md:66-70`)

The production gaps:

1. Role changes only take effect on next token refresh (`docs/detailed-designs/02-user-management.md:53`). That is too weak for urgent revocation.
2. Roles carry editable permission arrays in JSON (`docs/detailed-designs/02-user-management.md:94-97`) but there is no canonical permission catalog or migration/versioning strategy.
3. The design does not document audit requirements for admin actions such as create user, deactivate user, role changes, or permission changes.
4. The design does not define how deactivated users are blocked if they still hold a valid access token.

Recommendation:

1. Add token-version or session-version invalidation on user deactivation, password reset, and sensitive role changes.
2. Maintain a canonical permission registry in code and migrations, not only free-form JSON.
3. Audit every administrative mutation with actor, target, timestamp, request ID, and before/after values.

### 11. API Contract Discipline Needs To Be Stronger

The design uses reasonable REST patterns, but there are contract inconsistencies that will slow implementation:

- login accepts email only in the design, while L1 says email/username (`docs/specs/L1.md:4`, `docs/detailed-designs/01-authentication.md:80-85`)
- user and loan updates are documented as partial updates, but the endpoints use `PUT` rather than `PATCH` (`docs/detailed-designs/02-user-management.md:53`, `docs/detailed-designs/03-loan-management.md:28`)
- L2-4.3 requires pausing a single payment or date range, while the backend contract only exposes `payment_ids[]` (`docs/specs/L2.md:138-146`, `docs/detailed-designs/diagrams/plantuml/seq_pause_payment.puml:17-27`)
- L2-4.4 requires payment method capture, which is missing from the model/API (`docs/specs/L2.md:148-155`, `docs/detailed-designs/04-payment-tracking.md:39-46`)

Recommendation:

1. Publish an OpenAPI contract and generate typed clients from it.
2. Resolve requirement ambiguities before coding.
3. Use `PATCH` for partial updates or redefine the semantics of `PUT`.
4. Add request/response examples for every mutable endpoint.

### 12. Operational Readiness Is Underdesigned

The current design does not materially define:

- runtime topology for production
- Gunicorn/worker model and process management for Flask
- reverse proxy/load balancer assumptions
- connection pooling and DB timeout strategy
- health/readiness endpoints
- structured logging, metrics, tracing, alerting
- backup/restore, retention, and migration rollback
- CI/CD quality gates
- SAST/DAST/dependency scanning
- load, resilience, accessibility, and security testing strategy

The only testing statement in the stack summary is `pytest` (`docs/detailed-designs/00-index.md:15`), which is not enough as a production-readiness plan.

Recommendation:

1. Add an operational architecture document covering deployment, observability, recovery, and security controls.
2. Define SLOs and error budgets for core user flows.
3. Require the following test layers before production:
   - unit tests for services and calculators
   - integration tests with PostgreSQL
   - API contract tests
   - frontend E2E tests for critical flows
   - load tests for dashboard, notifications, and payment recording
   - security tests for auth, authorization, and rate limiting

## Stack-Specific Recommendations

### React SPA

- Use TypeScript throughout.
- Generate a typed client from OpenAPI.
- Use route guards and role-aware layouts.
- Keep auth state out of `localStorage`.
- Add route-level code splitting and bundle budgets.
- Use a consistent form/validation strategy and accessible modal primitives.
- Define CSP, XSS hardening, and error-boundary strategy early.

### Flask

- Use the application-factory pattern and modular blueprints.
- Keep service-layer orchestration, but formalize request validation and OpenAPI generation with a library such as `flask-smorest` or `apispec`.
- Add request ID middleware, structured logging, and centralized error mapping.
- Run the API behind Gunicorn with clearly defined worker counts and timeouts.
- Keep background jobs outside web workers.

### PostgreSQL And SQLAlchemy

- Use strict `Numeric`/`Decimal` handling for all monetary fields.
- Decide where balances are derived and enforce consistency through constraints and tests.
- Add row-locking strategy for financial writes.
- Use `CITEXT` or equivalent for case-insensitive unique email handling.
- Define composite indexes for the actual query shapes used by loans, payments, dashboard, notifications, and activity.
- Use JSONB only where schemaless storage is truly intentional, not for core financial facts.

## Requirement Ambiguities To Resolve Before Build

1. Login identifier:
   - L1 says email/username.
   - L2 and the auth design show email only.
2. Repayment frequencies:
   - L1 says weekly/monthly/custom.
   - L2 says weekly/bi-weekly/monthly/custom.
   - the documented algorithm is monthly only.
3. Borrower edit permissions:
   - current rule is too broad for a finance product.
4. Real-time notifications:
   - requirements imply real-time toast behavior.
   - design only documents polling and async email.
5. Pause/reschedule semantics:
   - the design does not define whether downstream installments shift, whether maturity changes, or how interest is recalculated.

## Recommended Next Steps

1. Add a frontend technical design that maps every L2 screen/interaction to routes, components, data contracts, and responsive rules.
2. Redesign the financial model around immutable payment transactions and allocation records.
3. Finalize the auth/session strategy for the React SPA, including secure token handling, revocation, and rotation.
4. Add explicit transaction, locking, idempotency, and outbox patterns to every money-moving or multi-write workflow.
5. Choose a concrete worker/scheduler topology and update the container diagram accordingly.
6. Publish an OpenAPI spec and use it as the source of truth for frontend/backend integration.
7. Add an operational readiness document covering deployment, observability, backup/restore, security hardening, and test strategy.

## Bottom Line

This design is a useful foundation, but it is still a foundation. The system is not yet designed to the standard expected for a secure, high-performance, production-grade financial application. The next design iteration should focus less on adding more endpoints and more on making the core flows safe, consistent, observable, and implementable end to end.

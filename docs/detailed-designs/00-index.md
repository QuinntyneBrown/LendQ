# LendQ Detailed Design Index

**Requirements**: L1-1 through L1-12

## Overview

This document is the entry point for the full detailed design set for LendQ. The target implementation is a Blazor WebAssembly SPA, a Flask API, PostgreSQL for system of record data, Redis for cache and queue coordination, Celery workers for asynchronous processing, and an OpenAPI contract used as the integration source of truth.

## System Context

![C4 Context](diagrams/rendered/c4_context.png)

*Source: [diagrams/plantuml/c4_context.puml](diagrams/plantuml/c4_context.puml)*

![C4 Container](diagrams/rendered/c4_container.png)

*Source: [diagrams/plantuml/c4_container.puml](diagrams/plantuml/c4_container.puml)*

## Architecture Baseline

| Area | Design Decision |
|---|---|
| Client architecture | Blazor WebAssembly SPA with lazy-loaded assemblies, scoped HttpClient services for server state, EditForm with DataAnnotationsValidator for input validation, and a shared responsive component system derived from `docs/ui-design.pen`. |
| Session model | Short-lived access token stored in memory only. Long-lived refresh session stored in a `Secure`, `HttpOnly`, `SameSite=Strict` cookie. Refresh and logout endpoints are CSRF protected. |
| Identity & revocation | Every session is persisted server side. Access validation checks `session_id`, `session_version`, user status, and role state so deactivation and privileged role changes take effect immediately. |
| Financial system of record | Authoritative balances are derived from immutable `payment_transactions`, `payment_allocations`, loan terms versions, and schedule versions. Destructive edits are not permitted for balance-affecting records. |
| Notification delivery | Domain events are written to a transactional outbox. Celery workers deliver in-app and email notifications, deduplicate by event and channel, and fan out in-app updates over Server-Sent Events. |
| Operations | API, worker, scheduler, database, cache, tracing, metrics, health checks, backups, and CI quality gates are documented in Module 16. |
| API governance | `docs/api/openapi.yaml` is the contract source of truth. Breaking changes require a new API version or a formal deprecation window. |

## Cross-Cutting Conventions

| Topic | Decision |
|---|---|
| API base path | `/api/v1` |
| Error envelope | All non-stream responses use `{ "code", "message", "request_id", "details?" }` |
| Correlation | Every request is assigned `X-Request-Id`; the value flows into logs, traces, audit events, and async jobs |
| Pagination | Cursor or page/size are explicitly declared per endpoint in OpenAPI; response objects include paging metadata |
| Optimistic concurrency | Loan-term edits and schedule-affecting writes carry a version field or `If-Match` header |
| Safe retries | Balance-affecting POST endpoints require `Idempotency-Key` |
| Auditability | Security events, admin actions, term changes, schedule changes, payment postings, reversals, and delivery failures are immutable audit events |
| Time handling | All timestamps are stored and exchanged in UTC ISO 8601 |
| Currency handling | Monetary amounts use fixed precision decimal fields and ISO 4217 currency codes |

## Document Map

| Module | Scope |
|---|---|
| [01-authentication.md](01-authentication.md) | Auth APIs, email verification, password reset, secure session lifecycle, session inventory |
| [02-user-management.md](02-user-management.md) | Admin user management, RBAC, permission catalog, borrower directory, admin audit |
| [03-loan-management.md](03-loan-management.md) | Loan creation, governed loan-term edits, terms versions, change-request approval |
| [04-payment-tracking.md](04-payment-tracking.md) | Immutable payment ledger, allocations, reversals, schedule adjustment rules |
| [05-dashboard.md](05-dashboard.md) | Summary read models, activity feed, freshness behavior, partial-failure handling |
| [06-notifications.md](06-notifications.md) | Notification event pipeline, SSE delivery, preferences, retry and dedupe |
| [07-fe-architecture.md](07-fe-architecture.md) | Blazor WebAssembly architecture, route protection, responsive shell, accessibility, performance budgets |
| [08-fe-authentication.md](08-fe-authentication.md) | Blazor auth flows, bootstrap, verify-email, reset-password, session-expiry UX |
| [09-fe-user-management.md](09-fe-user-management.md) | Admin user and role UX, audit search, revocation behavior |
| [10-fe-loan-management.md](10-fe-loan-management.md) | Loan list/detail Razor components, governed edits, schedule builder, borrower change requests |
| [11-fe-payment-tracking.md](11-fe-payment-tracking.md) | Payment entry, allocation preview, reversal UX, schedule-adjustment Razor components |
| [12-fe-dashboard.md](12-fe-dashboard.md) | Dashboard Razor components, freshness indicators, independent section loading and recovery |
| [13-fe-notifications.md](13-fe-notifications.md) | Notification bell, list, SSE updates via JS interop, toasts, reconciliation behavior |
| [14-fe-settings-preferences.md](14-fe-settings-preferences.md) | Settings Razor components for notification preferences and session/security controls |
| [15-security-session-architecture.md](15-security-session-architecture.md) | Cross-cutting security controls, trust boundaries, headers, CSRF, abuse protection |
| [16-operational-readiness-and-api-governance.md](16-operational-readiness-and-api-governance.md) | Observability, worker reliability, health, backup and restore, CI gates, API governance |

## Contract Source Of Truth

The machine-readable API contract is maintained in [docs/api/openapi.yaml](../api/openapi.yaml). The markdown modules summarize design intent; contract details, request and response schemas, headers, and error codes are defined in the OpenAPI file.

# LendQ Detailed Design Review

Date: 2026-03-27

## Scope

Artifacts reviewed:

- `docs/specs/L1.md`
- `docs/specs/L2.md`
- `docs/api/openapi.yaml`
- `docs/detailed-designs/00-index.md` through `16-operational-readiness-and-api-governance.md`
- PlantUML sources and rendered PNGs under `docs/detailed-designs/diagrams/`

## Executive Summary

The design set now addresses the prior blocking findings. The backend and frontend designs share one session model, one API contract, one governed loan model, one immutable payment model, one event-driven notification model, and one operations baseline.

This is now a coherent production-target design set rather than a collection of partially aligned feature notes.

## Closed Findings

| Prior finding | Resolution |
|---|---|
| Frontend token storage violated security requirements | Replaced with memory-only access tokens, `HttpOnly` refresh cookie, CSRF controls, and immediate session invalidation across Modules 1, 7, 8, and 15 |
| Frontend and backend contracts were inconsistent | Introduced [docs/api/openapi.yaml](api/openapi.yaml) and aligned all feature modules to the same endpoints and payloads |
| Payment model was mutable and non-auditable | Replaced with immutable `payment_transactions`, `payment_allocations`, reversals, schedule-version preservation, and idempotent write rules in Module 4 and Module 11 |
| Borrowers could directly edit creditor-controlled loan terms | Replaced with borrower change-request flow, approval endpoints, and terms-version history in Modules 3 and 10 |
| Notification design relied on polling and lacked reliability design | Standardized on transactional outbox, Celery workers, SSE delivery, preferences, and delivery-state tracking in Modules 6, 13, 14, and 16 |
| Role changes only took effect on next token refresh | Session-version invalidation and refresh-session revocation are now first-class design rules in Modules 1, 2, and 15 |
| Operational readiness and API governance were missing | Added Modules 15 and 16 plus the OpenAPI contract |
| Design index and rendered frontend PNGs were stale or missing | Rebuilt the index and regenerated PlantUML PNGs for all referenced diagrams |

## Requirement Coverage Summary

| Requirement area | Status | Notes |
|---|---|---|
| L1-1 Authentication & secure session management | Covered | Verification, reset, refresh, logout, session inventory, and revocation are all designed |
| L1-2 User management & RBAC | Covered | Controlled permission catalog, admin audit, immediate revocation, and borrower directory are defined |
| L1-3 Loan management & terms governance | Covered | Required fields, versioning, borrower request flow, and approval model are defined |
| L1-4 Payment tracking & balance management | Covered | Immutable ledger, allocations, reversals, idempotency, and schedule-adjustment rules are defined |
| L1-5 Dashboard & overview | Covered | Projection-based dashboard with freshness and partial failure handling is defined |
| L1-6 Notifications & alerts | Covered | Event-driven in-app delivery, email preferences, retries, dedupe, and delivery tracking are defined |
| L1-7 Responsive design | Covered | Route shell, navigation, dialogs, and feature modules align to the responsive system |
| L1-8 Security & abuse protection | Covered | Secure session transport, CSRF, rate limits, headers, secrets, and audit controls are defined |
| L1-9 Financial integrity & auditability | Covered | Terms versions, schedule versions, immutable transactions, and authoritative balance rules are defined |
| L1-10 Accessibility, client quality & performance | Covered | Route bootstrap, accessibility baseline, loading/error states, and performance expectations are defined |
| L1-11 Reliability, observability & operational readiness | Covered | Worker topology, health checks, backups, metrics, tracing, and release gates are defined |
| L1-12 API contract & governance | Covered | Versioned OpenAPI contract, stable errors, and safe retry rules are defined |

## Residual Risk

No blocking design findings remain from the previous audit. Remaining risk has shifted from design completeness to implementation quality:

- the eventual codebase must enforce the documented idempotency and session-version checks correctly
- OpenAPI must be kept in sync with implementation changes
- operational controls such as backup drills and load tests must be executed, not only documented

## Conclusion

The prior audit findings have been resolved in the current design set. The repository now contains a materially complete production-target design baseline for the chosen stack.

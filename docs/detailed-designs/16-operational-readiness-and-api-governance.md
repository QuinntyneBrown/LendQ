# Module 16: Operational Readiness & API Governance

**Requirements**: L1-11, L1-12, L2-11.1, L2-11.2, L2-11.3, L2-11.4, L2-12.1, L2-12.2, L2-12.3

## Overview

This document defines the production operations baseline and the API-governance rules required for implementation. It resolves the prior gap where the design set described application behavior but not how the system is safely operated, monitored, versioned, or released.

## Deployment Topology

| Component | Responsibility |
|---|---|
| Web tier | ASP.NET Core Web API served behind a reverse proxy (Kestrel + reverse proxy) with TLS termination and readiness gating |
| Worker tier | .NET BackgroundService workers process email, notification, projection, and scheduled jobs |
| Scheduler | Hangfire Recurring Jobs schedule recurring jobs; no single-web-instance cron behavior is permitted |
| Database | PostgreSQL is the system of record for users, loans, schedules, payments, notifications, audit, and outbox tables |
| Cache / broker | Redis handles rate-limit counters, caching, and short-lived coordination state |
| Observability | Structured logs, metrics, traces, alert routing, and dashboards |

## Health, Backup, And Recovery

| Capability | Design |
|---|---|
| Liveness | `/health/live` checks process health only (ASP.NET Core health checks via Microsoft.Extensions.Diagnostics.HealthChecks) |
| Readiness | `/health/ready` checks database, Redis, migration level, and required downstream configuration (ASP.NET Core health checks via Microsoft.Extensions.Diagnostics.HealthChecks) |
| Backup | Automated PostgreSQL backups with point-in-time recovery where supported; backup retention and encryption are mandatory |
| Restore validation | Scheduled restore drills in non-production validate recovery procedures |
| Recovery objectives | Documented RPO and RTO targets are reviewed before production launch |
| Schema safety | Migrations must be backward compatible for rolling deploys or have a tested safe-forward plan |

## Logging, Metrics, And Tracing

### Logs

- JSON structured logs via Serilog with structured JSON sink
- mandatory `request_id`, `user_id` when known, `session_id` when known, endpoint, status code, and latency
- no raw secrets, passwords, refresh tokens, or full access tokens

### Metrics

- request latency, throughput, error rate
- queue depth and worker retry counts
- notification delivery success/failure counts
- payment submission success, duplicate prevention hits, reversal counts
- projection lag for dashboard and notification read models

### Traces

OpenTelemetry for .NET traces link:

- browser request to API
- API transaction to outbox event
- outbox relay to .NET BackgroundService worker
- worker execution to notification or email delivery

## Quality Gates

Releases are blocked unless the following pass:

- unit tests for domain services and validation rules
- integration tests for auth, RBAC, loan governance, payment ledger, and notification delivery
- end-to-end tests for login, verify email, create loan, borrower request, record payment, reverse payment, and preference changes
- migration validation in CI against a production-like PostgreSQL version
- dependency, SAST, and secret scanning
- load tests for login, dashboard, payment posting, and notification fan-out paths

## API Governance

### Source Of Truth

The supported public contract is [docs/api/openapi.yaml](../api/openapi.yaml). Generated clients, server request validation, and API documentation are derived from that file.

### Versioning Rules

- All public endpoints live under `/api/v1`.
- Breaking request or response changes require `/api/v2` or a documented deprecation window.
- Deprecated fields and endpoints remain documented until removal.

### Error Semantics

The public error envelope is:

```json
{
  "code": "validation_error",
  "message": "One or more fields are invalid.",
  "request_id": "req_123",
  "details": {
    "field": ["must not be empty"]
  }
}
```

Distinct error codes are reserved for validation, authentication, authorization, conflict, rate limit, idempotency replay, and not found cases.

### Safe Retry Rules

- Balance-affecting POST endpoints define `Idempotency-Key` behavior in OpenAPI.
- Retry of a completed idempotent request returns the original semantic result and must not create additional monetary effects.
- Conflict responses surface stale-version information where appropriate without leaking internal implementation details.

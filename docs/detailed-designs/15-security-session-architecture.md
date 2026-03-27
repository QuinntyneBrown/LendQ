# Module 15: Security & Session Architecture

**Requirements**: L1-1, L1-8, L1-9, L2-1.4, L2-1.5, L2-8.1, L2-8.2, L2-8.3, L2-8.4, L2-9.3

## Overview

This document defines the security baseline for the LendQ application. It resolves the prior mismatch between the requirements and the detailed designs by standardizing session handling, abuse protection, auditability, and request hardening across the SPA, API, and worker tiers.

## Trust Boundaries

| Boundary | Control |
|---|---|
| Browser to API | HTTPS only, HSTS enabled, strict origin and CORS policy |
| SPA runtime | Access token stored in memory only; no sensitive token is persisted in `localStorage`, `sessionStorage`, or IndexedDB |
| Refresh session | Opaque refresh identifier in `Secure`, `HttpOnly`, `SameSite=Strict` cookie with server-side session record |
| Async processing | Celery workers consume only internal jobs produced from a transactional outbox; end-user clients cannot enqueue jobs directly |
| Secrets | Rotated through external secret management; never stored in source control or emitted to logs |

## Session Model

1. `POST /api/v1/auth/login` verifies credentials and email-verification state, creates a server-side refresh session, sets the refresh cookie, and returns a short-lived access token in the response body.
2. The SPA stores the access token in memory only.
3. `POST /api/v1/auth/refresh` rotates the refresh session, returns a new access token, and preserves CSRF protections.
4. Authorization middleware validates access-token signature, `session_id`, `session_version`, user status, and role status.
5. User deactivation, password reset, or privileged role removal revokes matching refresh sessions immediately and increments `session_version` so existing access tokens fail on their next request rather than waiting for expiry.

## CSRF, XSS, And Browser Protections

| Concern | Control |
|---|---|
| CSRF | Refresh, logout, logout-all, session revoke, and other cookie-authenticated POST/DELETE endpoints require a synchronizer or double-submit CSRF token via `X-CSRF-Token` |
| XSS | CSP blocks inline script by default, restricts script sources to trusted origins, and forbids framing except where explicitly required |
| Clickjacking | `frame-ancestors 'none'` in CSP and `X-Frame-Options: DENY` for legacy support |
| MIME sniffing | `X-Content-Type-Options: nosniff` |
| Referrer leakage | `Referrer-Policy: strict-origin-when-cross-origin` |
| Transport security | `Strict-Transport-Security` enabled with preload-capable configuration in production |

## Abuse Protection

| Endpoint class | Control |
|---|---|
| Login, sign-up, forgot-password | Per-IP and per-email throttles, burst and rolling-window limits, suspicious-event audit logging |
| Payment submission and reversal | Per-user and per-loan throttles plus required `Idempotency-Key` |
| Borrower search directory | Authenticated only, low result cap, debounced client usage, request logging |
| SSE connections | Connection cap per session and heartbeat timeout handling |

Repeated authentication failures trigger escalating backoff. User-facing error messages remain generic on discovery-sensitive flows.

## Sensitive Audit Events

The immutable audit log captures:

- login success and failure
- logout and logout-all
- session revocation
- password reset request and completion
- email verification events
- role and permission changes
- loan-term changes and approvals
- payment postings and reversals
- notification delivery failures

Each record stores `request_id`, actor, target, action, outcome, timestamp, and selected before/after values where applicable.

## Financial Write Safety

All balance-affecting endpoints must:

- require `Idempotency-Key`
- operate in a single database transaction
- write the business event and outbox event atomically
- reject stale writes using optimistic concurrency where versions are exposed

This is the control that prevents duplicate monetary effect during retries or concurrent edits.

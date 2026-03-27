# Module 1: Authentication

**Requirements**: L1-1, L1-8, L2-1.1, L2-1.2, L2-1.3, L2-1.4, L2-1.5, L2-8.1, L2-8.2, L2-8.4

## Overview

The authentication module implements email-based identity, verification, password reset, secure session renewal, session inventory, and immediate revocation. It replaces the prior local-storage token design with a production-safe session model aligned to the updated requirements.

## C4 Component Diagram

![C4 Component — Auth](diagrams/rendered/c4_component_auth.png)

*Source: [diagrams/plantuml/c4_component_auth.puml](diagrams/plantuml/c4_component_auth.puml)*

## Class Diagram

![Class Diagram — Auth](diagrams/rendered/class_auth.png)

*Source: [diagrams/plantuml/class_auth.puml](diagrams/plantuml/class_auth.puml)*

## Public Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| `POST` | `/api/v1/auth/signup` | Create account, assign default borrower role, send verification email | No |
| `POST` | `/api/v1/auth/login` | Validate credentials, create refresh session, set cookie, return access token + user | No |
| `POST` | `/api/v1/auth/email-verification/resend` | Resend verification email | No |
| `POST` | `/api/v1/auth/email-verification/confirm` | Verify email token | No |
| `POST` | `/api/v1/auth/forgot-password` | Begin password reset flow with generic response | No |
| `POST` | `/api/v1/auth/reset-password` | Reset password and revoke all sessions | No |
| `POST` | `/api/v1/auth/refresh` | Rotate refresh session and return a new access token | Refresh cookie + CSRF |
| `GET` | `/api/v1/auth/me` | Return authenticated user summary and roles | Bearer |
| `POST` | `/api/v1/auth/logout` | Revoke current session | Bearer + CSRF |
| `POST` | `/api/v1/auth/logout-all` | Revoke all other sessions for the authenticated user | Bearer + CSRF |
| `GET` | `/api/v1/auth/sessions` | List active sessions | Bearer |
| `DELETE` | `/api/v1/auth/sessions/{sessionId}` | Revoke a specific session | Bearer + CSRF |

## Session Model

| Item | Design |
|---|---|
| Access token | Signed JWT, 10 minute TTL, returned in response body only, stored by the SPA in memory only |
| Refresh session | Opaque session identifier in `Secure`, `HttpOnly`, `SameSite=Strict` cookie, rotated on login and refresh |
| Revocation source of truth | `auth_sessions` table plus `users.session_version` |
| Immediate invalidation | Password reset, user deactivation, and privileged role removal revoke refresh sessions and increment `session_version` |
| CSRF protection | Cookie-authenticated auth endpoints require `X-CSRF-Token` |

Every authorized API request validates token signature, `session_id`, current `session_version`, user status, and role status. This is what makes access revocation immediate rather than effective only on refresh.

## Core Flows

### Login

![Sequence — Login](diagrams/rendered/seq_login.png)

*Source: [diagrams/plantuml/seq_login.puml](diagrams/plantuml/seq_login.puml)*

1. User submits email and password.
2. `AuthService` loads the user, checks account status and email-verification policy, and verifies the password hash with Argon2id.
3. On success, the service creates an `auth_session` row, issues an access token containing `user_id`, `session_id`, and `session_version`, and sets the refresh cookie.
4. The response body returns `{access_token, expires_in_seconds, user}`.
5. Failed authentication returns a generic `401` without revealing whether the account exists.

### Sign-Up And Email Verification

![Sequence — Sign-Up](diagrams/rendered/seq_signup.png)

*Source: [diagrams/plantuml/seq_signup.puml](diagrams/plantuml/seq_signup.puml)*

1. Sign-up creates the user in an inactive-unverified state with the default `BORROWER` role.
2. A single-use email-verification token is stored hashed with an expiry timestamp.
3. A verification email is queued through the transactional outbox and email worker.
4. `POST /api/v1/auth/email-verification/confirm` marks the email verified, activates the account, and emits an audit event.

### Forgot Password And Global Revocation

![Sequence — Forgot Password](diagrams/rendered/seq_forgot_password.png)

*Source: [diagrams/plantuml/seq_forgot_password.puml](diagrams/plantuml/seq_forgot_password.puml)*

1. Forgot-password always returns success to the caller.
2. If the user exists, a hashed reset token with short expiry is written and an email job is enqueued.
3. Completing the reset changes the password hash, revokes every refresh session, increments `session_version`, and records a security audit event.

## Data Model

| Entity | Purpose |
|---|---|
| `users` | Primary identity, email verification state, status, session version |
| `auth_sessions` | Server-side refresh session inventory with rotation, revocation, user agent, IP metadata, and last-seen timestamp |
| `email_verification_tokens` | Single-use hashed verification tokens |
| `password_reset_tokens` | Single-use hashed password reset tokens |
| `security_audit_events` | Immutable record of auth successes, failures, resets, revocations, and suspicious events |

## Security Controls

- Passwords use Argon2id with server-side pepper and externally managed secrets.
- Authentication, sign-up, and reset flows are rate-limited per IP and per email.
- Discovery-sensitive responses are generic.
- Refresh cookies are not readable by client-side scripts.
- Audit logs store request identifiers and outcomes, but never raw passwords or full tokens.

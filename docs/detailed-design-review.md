# LendQ Detailed Design Review

Date: 2026-03-27

## Scope

Artifacts reviewed:

- `docs/specs/L1.md`
- `docs/specs/L2.md`
- `docs/detailed-designs/00-index.md`
- `docs/detailed-designs/01-authentication.md` through `13-fe-notifications.md`
- PlantUML and Draw.io sources under `docs/detailed-designs/diagrams/`
- `docs/ui-design.pen`

## Executive Summary

The design set is materially stronger than the previous revision. The most important improvement is that the system is no longer documented as backend-only: the new frontend design modules define a React SPA architecture, route structure, responsive navigation, shared UI system, and primary screen flows.

That said, the project is still not ready to be treated as a secure, production-ready implementation design for a financial application.

The main blockers are now more specific:

1. The updated requirements are stronger than the updated designs. Several new security, financial-integrity, notification-reliability, and operational requirements are still not designed.
2. Some frontend and backend designs now contradict each other on core integration points.
3. The session/token model directly conflicts with the revised security requirements.
4. The loan and payment models still do not satisfy the new immutable, auditable financial-record requirements.

Verdict: the frontend architecture gap has been substantially reduced, but the system still needs another design pass before implementation should begin.

## Material Improvements Since The Prior Audit

- Frontend technical architecture now exists in `07-fe-architecture.md`, with module boundaries, routing, shared UI, and responsive navigation.
- Frontend feature designs now exist for auth, users, loans, payments, dashboard, and notifications in `08` through `13`.
- The frontend design maps many components back to `ui-design.pen`, especially dashboard, auth, loan detail, payment dialogs, notification dropdowns, and toast behavior.
- The client data-fetching story is clearer: TanStack Query cache keys, invalidation behavior, and basic route protection are documented.
- Dashboard loading behavior and partial rendering are better documented than before.

## Requirement Coverage Summary

Status legend:

- `Covered`: materially addressed by current designs
- `Partial`: substantially addressed, but notable gaps remain
- `At Risk`: documented, but the current design is likely to fail the requirement or create production risk
- `Missing`: no material design coverage

| Requirement Area | Status | Notes |
|---|---|---|
| L1-1 User Authentication & Secure Session Management | Partial | Core screens and refresh flow are designed, but email verification is missing and token storage violates the revised security requirements. |
| L1-2 User Management & RBAC | Partial | Admin UX exists, but immediate revocation, permission-catalog governance, and audit expectations are not fully designed. |
| L1-3 Loan Management & Terms Governance | At Risk | Core screens exist, but required loan-term fields, borrower approval workflow, and terms versioning are not reflected in the backend or frontend design. |
| L1-4 Payment Tracking, Scheduling & Balance Management | At Risk | Core payment flows exist, but immutable transactions, allocations, reversals, and idempotent money movement are still not designed. |
| L1-5 Dashboard & Overview | Partial | Good frontend coverage exists, but backend balance source of truth and freshness semantics remain weak. |
| L1-6 Notifications & Alerts | Partial | Notification surfaces exist, but event-driven delivery, delivery status, preferences, and worker topology are not fully designed. |
| L1-7 Responsive Design | Partial | Frontend architecture and dashboard breakpoint designs exist, but visual coverage for many non-dashboard screens is still desktop-first and inferred. |
| L1-8 Application Security & Abuse Protection | At Risk | Requirements are explicit, but the current auth/session design directly conflicts with them. |
| L1-9 Financial Integrity & Auditability | At Risk | The current financial model still centers on mutable schedule rows rather than an authoritative transaction/allocation system. |
| L1-10 Accessibility, Client Quality & Performance | Partial | Route protection, loading skeletons, and responsive layout are documented, but accessibility semantics and concrete performance targets are not. |
| L1-11 Reliability, Observability & Operational Readiness | Missing | No concrete design set covers health checks, telemetry, backup/restore, recovery objectives, or release quality gates. |
| L1-12 API Contract & Integration Governance | Partial | API conventions exist, but no OpenAPI contract, deprecation policy, or idempotency contract is designed. |

## Priority Findings

| Severity | Finding | Why It Matters |
|---|---|---|
| Critical | Frontend token storage violates the new security requirements | The current SPA stores access and refresh tokens in `localStorage`, which directly conflicts with `docs/specs/L2.md:364-370`. |
| Critical | The frontend and backend contract is inconsistent on core flows | Auth bootstrap and loan creation depend on endpoints or permissions the backend design does not provide. |
| Critical | The payment model still does not satisfy the new financial-integrity requirements | Mutable payment rows are not enough for authoritative balances, allocations, reversals, and safe retries. |
| High | Loan governance still contradicts the revised borrower-change requirements | The designs still allow borrowers to directly edit most loan fields instead of using request/approval flow with version history. |
| High | Notification design does not meet the revised real-time and reliability requirements | The current design is polling-centric and does not model delivery status, preferences, or reliable worker-based processing. |
| High | Session revocation and role-change enforcement are inconsistent | Requirements call for immediate invalidation, while the backend still defers role impact to next token refresh. |
| High | Operational-readiness requirements remain undesigned | The current design set still lacks concrete observability, recovery, and CI/CD quality-gate architecture. |
| Medium | Visual and documentation completeness is uneven | New frontend docs reference rendered diagrams that do not exist, and some required user flows have no matching visual design artifact. |

## Detailed Feedback

### 1. Frontend Architecture Is Now Materially Present

This is the biggest improvement in the current revision.

The new frontend architecture defines:

- project structure and feature modules in `docs/detailed-designs/07-fe-architecture.md:47-123`
- route map and role guards in `docs/detailed-designs/07-fe-architecture.md:125-143`
- responsive navigation strategy in `docs/detailed-designs/07-fe-architecture.md:190-213`
- shared UI system and design tokens in `docs/detailed-designs/07-fe-architecture.md:215-256`

This closes a major gap from the previous audit. The design is no longer missing a frontend implementation story.

The remaining issue is traceability depth:

- `07-fe-architecture.md` is still scoped only to `L1-7, L2-7.1, L2-7.2, L2-7.3` at `docs/detailed-designs/07-fe-architecture.md:3`, even though the document now materially participates in `L1-10` and `L1-12`.
- Several new cross-cutting requirements added to `L2.md` are not mapped to any detailed design module.

Recommendation:

1. Update document scopes so every detailed design module explicitly names the new L2 requirements it is meant to satisfy.
2. Add one cross-cutting design doc for security/session architecture and one for operational readiness/API governance.

### 2. Session And Token Design Now Explicitly Conflicts With The Requirements

The new requirements are clear:

- `docs/specs/L2.md:364-370` requires protected session transport/storage and explicitly says sensitive session tokens must not be exposed to client-side script-readable persistent storage.

The frontend design does the opposite:

- `docs/detailed-designs/07-fe-architecture.md:181-182` attaches access tokens from `localStorage`
- `docs/detailed-designs/07-fe-architecture.md:279-283` retrieves refresh tokens from `localStorage`
- `docs/detailed-designs/08-fe-authentication.md:91` saves tokens to `localStorage`
- `docs/detailed-designs/08-fe-authentication.md:110` bootstraps auth from `localStorage`
- `docs/detailed-designs/08-fe-authentication.md:164-165` documents both access and refresh tokens in `localStorage`

This is now a direct requirement violation, not just a best-practice concern.

There are additional auth coverage gaps:

- `docs/specs/L1.md:4` and `docs/specs/L2.md:24,51` require email verification behavior.
- The backend auth design exposes only `login`, `signup`, `forgot-password`, `reset-password`, `refresh`, and `logout` in `docs/detailed-designs/01-authentication.md:25-30`.
- The frontend auth API integration mirrors the same set in `docs/detailed-designs/08-fe-authentication.md:71-78`.

There is no verification endpoint, verification page, verification state model, or resend-verification flow in the design set.

Recommendation:

1. Redesign session handling around secure cookies or another compliant storage model that satisfies `L2-8.1`.
2. Add explicit CSRF/XSS protection strategy tied to the chosen credential transport.
3. Add email verification endpoints, frontend flows, and account-state handling.
4. Add session inventory and forced revocation behavior for deactivation, password reset, and role changes.

### 3. Frontend And Backend Contract Consistency Is Still A Blocking Issue

The updated frontend design is more concrete, but that also exposes hard API mismatches.

#### 3.1 Auth bootstrap depends on an endpoint that is not designed

Frontend auth calls `GET /api/v1/users/me`:

- `docs/detailed-designs/08-fe-authentication.md:91`
- `docs/detailed-designs/08-fe-authentication.md:110`

The backend design does not define that endpoint:

- auth endpoints in `docs/detailed-designs/01-authentication.md:25-30`
- user endpoints in `docs/detailed-designs/02-user-management.md:27-31`

The backend user API is admin-only and only supports `GET /users` and `GET /users/{id}`.

Result: the current login bootstrap path cannot work as designed.

#### 3.2 Loan creation depends on an admin-only user lookup endpoint

Frontend loan creation says the borrower search box calls:

- `GET /api/v1/users?role=Borrower&search=...` in `docs/detailed-designs/10-fe-loan-management.md:92-99`

But the backend user-list endpoint is explicitly admin-only:

- `docs/detailed-designs/02-user-management.md:27`
- enforced again in `docs/detailed-designs/02-user-management.md:50`

Result: creditors cannot legally use the documented borrower picker.

#### 3.3 Settings is routed but not designed

The frontend route map includes:

- `/settings` in `docs/detailed-designs/07-fe-architecture.md:140-141`

But there is no settings module, no settings backend design, and no settings UI in `ui-design.pen` beyond navigation labels.

This matters because notification preferences are now a requirement in `docs/specs/L2.md:304-310`.

Recommendation:

1. Publish an explicit API contract before continuing.
2. Add `GET /users/me` or change the auth bootstrap design.
3. Add a creditor-safe borrower lookup endpoint or redesign the create-loan flow.
4. Design the settings/preferences module or remove the route until it exists.

### 4. Loan Terms And Borrower Governance Still Lag The Revised Requirements

The revised requirements now require:

- currency, installment count or maturity date, and custom schedule support in `docs/specs/L2.md:125-137`
- borrower request/approval flow and terms versioning in `docs/specs/L2.md:150-157`

The backend loan design still omits key terms:

- loan entity in `docs/detailed-designs/03-loan-management.md:72-85` has no currency, installment count, maturity date, or custom schedule structure
- schedule generation still assumes `n` payments in `docs/detailed-designs/03-loan-management.md:89-92`, but `n` is not part of the documented loan model

The frontend loan form also omits those new required fields:

- create/edit modal fields in `docs/detailed-designs/10-fe-loan-management.md:42-47`
- validation schema in `docs/detailed-designs/10-fe-loan-management.md:124-130`

Borrower governance is still based on the old rule:

- backend update contract: borrower can update all fields except principal in `docs/detailed-designs/03-loan-management.md:28,52-55`
- frontend borrower edit restriction also only locks principal in `docs/detailed-designs/10-fe-loan-management.md:103-106`

That conflicts directly with `docs/specs/L1.md:10` and `docs/specs/L2.md:153-156`, which now require creditor-controlled terms to be non-editable by borrowers and changed through request/approval flow.

Recommendation:

1. Expand the loan model to include currency, installment count, maturity/end date, and custom schedule definition.
2. Replace direct borrower loan editing with a change-request workflow.
3. Add loan-term version history and approval-state design.
4. Update both backend and frontend route permissions to match the revised governance model.

### 5. The Payment Design Still Fails The New Financial-Integrity Standard

The revised requirements are explicit:

- payment transactions must be immutable and allocated across installments in `docs/specs/L2.md:212-219`
- schedule adjustments must preserve old and new schedules in `docs/specs/L2.md:221-228`
- balances must derive from authoritative transaction/allocation records in `docs/specs/L2.md:399-405`
- reversals/corrections are required in `docs/specs/L2.md:423-429`
- write operations need safe retry/idempotency behavior in `docs/specs/L2.md:415-421` and `docs/specs/L2.md:520`

The backend payment design still centers on a mutable `Payment` row:

- entity definition in `docs/detailed-designs/04-payment-tracking.md:89-103`
- record-payment behavior mutates the next due payment and recalculates balance in `docs/detailed-designs/04-payment-tracking.md:39-46`

There is still no design for:

- immutable payment transaction records
- allocation records
- reversal/correction endpoints
- transaction identifiers exposed to clients
- idempotency keys
- authoritative balance derivation from a financial ledger

The frontend payment design follows the same simplified model:

- record-payment mutation sends `{loanId, amount, date, notes}` in `docs/detailed-designs/11-fe-payment-tracking.md:109-110`
- even though the dialog captures payment method at `docs/detailed-designs/11-fe-payment-tracking.md:109`, the mutation contract omits it
- no reversal or correction UX is defined anywhere in `11-fe-payment-tracking.md`
- no allocation preview consistent with `docs/specs/L2.md:199` is defined beyond a general overpayment note in `docs/detailed-designs/11-fe-payment-tracking.md:142-146`

This is still the highest-risk domain gap in the system.

Recommendation:

1. Redesign the backend around `payment_transactions`, `payment_allocations`, and schedule items.
2. Add reversal/correction flows and corresponding UI/history behavior.
3. Add idempotency-key support for payment submission.
4. Make balances derived from authoritative records and document the exact source of truth.

### 6. Notification Design Is Better On The UI Surface, But Still Not Requirement-Compliant

The frontend now clearly documents:

- bell, dropdown, toast, and full-page notification surfaces in `docs/detailed-designs/13-fe-notifications.md:19-67`

That is good progress.

The remaining problem is that the revised requirements are stronger:

- near-real-time event-driven updates in `docs/specs/L2.md:278-285`
- delivery status and retry behavior in `docs/specs/L2.md:295-302`
- user notification preferences in `docs/specs/L2.md:304-310`
- dedicated worker infrastructure for async processing in `docs/specs/L2.md:463-469`

The current design still uses polling:

- backend unread count is expected to be polled at `docs/detailed-designs/06-notifications.md:38-41`
- frontend unread count polls every 30 seconds in `docs/detailed-designs/13-fe-notifications.md:78-91`

The backend notification entity still has no delivery-state fields:

- `docs/detailed-designs/06-notifications.md:67-75`

The backend worker topology is still unresolved:

- `docs/detailed-designs/06-notifications.md:79-82` says "Flask-APScheduler or Celery beat"

Notification preferences are required but not designed:

- required in `docs/specs/L2.md:304-310`
- no corresponding backend module or frontend settings page exists

Recommendation:

1. Decide whether real-time delivery is SSE, WebSocket, or a defined polling exception.
2. Add notification delivery-status, dedupe, retry, and preference models.
3. Design the settings/preferences UI and API.
4. Replace "APScheduler or Celery beat" with a concrete worker architecture.

### 7. Role Revocation And Permission Governance Remain Inconsistent

The revised requirements require immediate effect for deactivation and privileged role changes:

- `docs/specs/L2.md:95-100`

The backend user-management design still says:

- role changes take effect on next token refresh in `docs/detailed-designs/02-user-management.md:53`

That is a direct contradiction.

There is also still no documented controlled permission catalog in the backend data model:

- roles store `permissions` as JSON in `docs/detailed-designs/02-user-management.md:94-97`

This is weaker than the revised requirement for a controlled permission catalog in `docs/specs/L2.md:77-85`.

Recommendation:

1. Add session-version or token-version invalidation on deactivation and sensitive role changes.
2. Replace or constrain free-form permissions JSON with a canonical permission registry.
3. Audit role/permission changes as first-class security events.

### 8. Responsive UX Has Improved, But Accessibility And Visual Coverage Are Still Uneven

The frontend docs now document responsive navigation and many loading states well:

- responsive nav in `docs/detailed-designs/07-fe-architecture.md:190-213`
- dashboard skeleton/parallel loading in `docs/detailed-designs/12-fe-dashboard.md:74-82`

However, the detailed designs still do not materially specify:

- keyboard navigation semantics
- focus trapping/restoration in modal implementations
- ARIA labeling strategy
- color-contrast validation
- accessible error associations for all form components

Those requirements are now explicit in `docs/specs/L2.md:343-360`.

Visual breakpoint coverage is also uneven in `ui-design.pen`:

- dashboard has desktop/mobile/tablet frames at `docs/ui-design.pen:1887`, `docs/ui-design.pen:8162`, and `docs/ui-design.pen:8968`
- many other explicit visual designs are desktop-only, such as auth at `docs/ui-design.pen:1113`, `docs/ui-design.pen:1420`, `docs/ui-design.pen:1696`, users at `docs/ui-design.pen:3621`, loan detail at `docs/ui-design.pen:5217`, and dialogs at `docs/ui-design.pen:6523`, `docs/ui-design.pen:6833`, `docs/ui-design.pen:7061`, `docs/ui-design.pen:7301`

That means responsive behavior for many non-dashboard flows is still described mostly in prose rather than backed by explicit visual design artifacts.

Recommendation:

1. Add an accessibility design section to the frontend architecture and shared UI docs.
2. Expand `ui-design.pen` for the highest-risk missing flows at tablet and mobile breakpoints.
3. Add explicit designs for full notifications page, settings/preferences, email verification, and borrower change-request flows.

### 9. Operational Readiness And API Governance Are Still Largely Missing

The revised requirements now explicitly require:

- worker reliability in `docs/specs/L2.md:463-469`
- logs, metrics, and tracing in `docs/specs/L2.md:471-477`
- health, backup, and recovery in `docs/specs/L2.md:479-485`
- quality gates in `docs/specs/L2.md:487-493`
- machine-readable API contract and stable error semantics in `docs/specs/L2.md:497-520`

The current design set still has no concrete documentation for:

- health/readiness endpoints
- telemetry architecture
- backup/restore procedures
- recovery objectives
- CI/CD gates
- OpenAPI or equivalent machine-readable contract
- deprecation/version policy

The top-level backend design still stops at API conventions and a global error handler:

- conventions in `docs/detailed-designs/00-index.md:47-56`
- raw exception-to-client error handler in `docs/detailed-designs/00-index.md:68-77`

That error handler also conflicts with the new requirement that client-visible errors avoid leaking internal details:

- `docs/specs/L2.md:507-513`

Recommendation:

1. Add an operational architecture document.
2. Add an API contract/governance document with OpenAPI as source of truth.
3. Replace raw exception serialization with safe public error mapping and correlation IDs.

### 10. Documentation Integrity Needs Cleanup

Two documentation-quality issues remain:

#### 10.1 The top-level index is stale

`docs/detailed-designs/00-index.md:1` still calls the set "Backend Detailed Design Documentation" and only lists modules 1 through 6 at `docs/detailed-designs/00-index.md:36-43`, even though modules 7 through 13 now exist.

#### 10.2 Frontend markdown references rendered images that do not exist

Examples:

- `docs/detailed-designs/07-fe-architecture.md:27`, `:35`, `:147`, `:186`, `:260`, `:273`
- `docs/detailed-designs/08-fe-authentication.md:13`, `:82`
- `docs/detailed-designs/09-fe-user-management.md:13`, `:79`
- `docs/detailed-designs/10-fe-loan-management.md:13`, `:87`
- `docs/detailed-designs/11-fe-payment-tracking.md:13`, `:101`
- `docs/detailed-designs/12-fe-dashboard.md:13`, `:70`
- `docs/detailed-designs/13-fe-notifications.md:13`, `:84`

The referenced `diagrams/rendered/fe_*.png` files are not present in the repo.

These are not product-logic blockers, but they reduce the usefulness of the design set and should be cleaned up.

## Recommended Next Steps

1. Redesign session handling first. The current token-storage model is now explicitly non-compliant with the requirements.
2. Publish an API contract and resolve the blocking integration mismatches: `/users/me`, borrower lookup, settings/preferences, and payment submission payloads.
3. Redesign the loan and payment domain model around governed term changes, schedule versioning, immutable transactions, allocations, reversals, and idempotency.
4. Finalize the notification architecture: real-time delivery approach, delivery-state model, preferences, and worker topology.
5. Add cross-cutting docs for operations, observability, health/recovery, and release quality gates.
6. Refresh the design index and render the missing frontend diagrams.

## Bottom Line

This revision is meaningfully better than the previous one because the frontend no longer exists only as a visual artifact. But the revised requirements also raised the engineering bar, and the current designs do not yet clear it. The remaining gaps are not cosmetic. They are concentrated in security, contract consistency, financial integrity, notification reliability, and operational readiness, which are exactly the areas that determine whether this can become a safe production system.

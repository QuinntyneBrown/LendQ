# LendQ — Repository Folder Structure

**Based on**: L1/L2 Requirements, Backend Detailed Designs (01–06), Frontend Detailed Designs (07–13), UI Design (`ui-design.pen`)

---

```
LendQ/
├── docs/
│   ├── specs/
│   │   ├── L1.md
│   │   └── L2.md
│   ├── detailed-designs/
│   │   ├── 00-index.md
│   │   ├── 01-authentication.md
│   │   ├── 02-user-management.md
│   │   ├── 03-loan-management.md
│   │   ├── 04-payment-tracking.md
│   │   ├── 05-dashboard.md
│   │   ├── 06-notifications.md
│   │   ├── 07-fe-architecture.md
│   │   ├── 08-fe-authentication.md
│   │   ├── 09-fe-user-management.md
│   │   ├── 10-fe-loan-management.md
│   │   ├── 11-fe-payment-tracking.md
│   │   ├── 12-fe-dashboard.md
│   │   ├── 13-fe-notifications.md
│   │   └── diagrams/
│   │       ├── plantuml/
│   │       ├── drawio/
│   │       └── rendered/
│   ├── ui-design.pen
│   └── repository-structure.md
│
│
│ ═══════════════════════════════════════════════════
│  BACKEND — Python / Flask
│ ═══════════════════════════════════════════════════
│
├── backend/
│   ├── pyproject.toml                        # Project metadata, dependencies, tool config
│   ├── requirements.txt                      # Pinned production dependencies
│   ├── requirements-dev.txt                  # Dev/test dependencies (pytest, ruff, etc.)
│   ├── .env.example                          # Environment variable template
│   ├── alembic.ini                           # Alembic migration config
│   │
│   ├── app/
│   │   ├── __init__.py                       # Flask application factory (create_app)
│   │   ├── config.py                         # Config classes (Dev, Test, Prod) — L2-8.3
│   │   ├── extensions.py                     # SQLAlchemy, Migrate, Marshmallow, JWT init
│   │   │
│   │   │ ── Models (Entity/Model Layer) ─────────────────────────
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py                       # User, Role, UserRole — L2-2.1
│   │   │   ├── loan.py                       # Loan — L2-3.1, L2-3.3
│   │   │   ├── payment.py                    # Payment — L2-4.1
│   │   │   ├── change_log.py                 # ChangeLog — L2-4.5, L2-9.2
│   │   │   ├── notification.py               # Notification — L2-6.1
│   │   │   ├── activity.py                   # ActivityItem — L2-5.3
│   │   │   ├── audit_log.py                  # AuditLog — L2-2.5, L2-8.4
│   │   │   ├── refresh_token.py              # RefreshToken — L2-1.4
│   │   │   └── notification_preference.py    # NotificationPreference — L2-6.5
│   │   │
│   │   │ ── Repositories (Data Access Layer) ────────────────────
│   │   │
│   │   ├── repositories/
│   │   │   ├── __init__.py
│   │   │   ├── base.py                       # BaseRepository (generic CRUD)
│   │   │   ├── user_repository.py            # User queries, search, role filters
│   │   │   ├── role_repository.py            # Role queries, permission lookups
│   │   │   ├── loan_repository.py            # Loan queries, creditor/borrower filters
│   │   │   ├── payment_repository.py         # Payment schedule, history, status filters
│   │   │   ├── change_log_repository.py      # Change log queries
│   │   │   ├── notification_repository.py    # Notification queries, unread count
│   │   │   ├── activity_repository.py        # Activity feed queries
│   │   │   └── audit_log_repository.py       # Audit log queries — L2-8.4
│   │   │
│   │   │ ── Services (Business Logic Layer) ─────────────────────
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py               # Login, signup, forgot/reset password — L2-1.1–L2-1.5
│   │   │   ├── token_service.py              # JWT generation, refresh, revocation — L2-1.4
│   │   │   ├── password_service.py           # bcrypt hashing, password policy — L2-1.5
│   │   │   ├── user_service.py               # User CRUD, deactivation — L2-2.1–L2-2.5
│   │   │   ├── role_service.py               # Role/permission management — L2-2.3
│   │   │   ├── loan_service.py               # Loan CRUD, borrower restrictions — L2-3.1–L2-3.5
│   │   │   ├── schedule_service.py           # Payment schedule generation — L2-3.3, L2-4.7
│   │   │   ├── payment_service.py            # Record, reschedule, pause — L2-4.1–L2-4.7
│   │   │   ├── balance_service.py            # Authoritative balance calc — L2-9.1
│   │   │   ├── dashboard_service.py          # Summary aggregation — L2-5.1–L2-5.4
│   │   │   ├── notification_service.py       # Create, deliver, deduplicate — L2-6.1–L2-6.5
│   │   │   ├── email_service.py              # Email dispatch — L2-6.4
│   │   │   ├── activity_service.py           # Activity feed creation — L2-5.3
│   │   │   └── audit_service.py              # Audit logging — L2-8.4
│   │   │
│   │   │ ── Controllers (API Layer) ─────────────────────────────
│   │   │
│   │   ├── controllers/
│   │   │   ├── __init__.py
│   │   │   ├── auth_controller.py            # /api/v1/auth/* — login, signup, refresh, logout
│   │   │   ├── user_controller.py            # /api/v1/users/* — CRUD, search
│   │   │   ├── role_controller.py            # /api/v1/roles/* — list, update permissions
│   │   │   ├── loan_controller.py            # /api/v1/loans/* — CRUD, role-filtered list
│   │   │   ├── payment_controller.py         # /api/v1/loans/{id}/payments, /payments/{id}/*
│   │   │   ├── dashboard_controller.py       # /api/v1/dashboard/* — summary, loans, activity
│   │   │   └── notification_controller.py    # /api/v1/notifications/* — list, count, mark read
│   │   │
│   │   │ ── Schemas (Serialization) ─────────────────────────────
│   │   │
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── auth_schemas.py               # LoginRequest, TokenResponse, SignUpRequest
│   │   │   ├── user_schemas.py               # UserSchema, CreateUserRequest, UpdateUserRequest
│   │   │   ├── role_schemas.py               # RoleSchema, PermissionUpdateRequest
│   │   │   ├── loan_schemas.py               # LoanSchema, CreateLoanRequest, UpdateLoanRequest
│   │   │   ├── payment_schemas.py            # PaymentSchema, RecordPaymentRequest, RescheduleRequest
│   │   │   ├── dashboard_schemas.py          # DashboardSummarySchema, ActivityItemSchema
│   │   │   ├── notification_schemas.py       # NotificationSchema
│   │   │   └── pagination.py                 # PaginatedResponseSchema
│   │   │
│   │   │ ── Middleware & Security ───────────────────────────────
│   │   │
│   │   ├── middleware/
│   │   │   ├── __init__.py
│   │   │   ├── auth_middleware.py            # JWT verification, require_role decorator — L2-1.4
│   │   │   ├── rate_limiter.py               # Per-IP / per-account rate limiting — L2-1.5, L2-8.2
│   │   │   ├── cors.py                       # CORS configuration — L2-8.3
│   │   │   ├── security_headers.py           # CSP, HSTS, X-Content-Type — L2-8.3
│   │   │   ├── request_id.py                 # X-Request-ID generation/propagation — L2-11.2
│   │   │   └── idempotency.py                # Idempotency key handling — L2-9.3
│   │   │
│   │   │ ── Error Handling ──────────────────────────────────────
│   │   │
│   │   ├── errors/
│   │   │   ├── __init__.py
│   │   │   ├── handlers.py                   # Global error handler — L2-12.2
│   │   │   └── exceptions.py                 # AuthenticationError, AuthorizationError, etc.
│   │   │
│   │   │ ── Background Jobs ─────────────────────────────────────
│   │   │
│   │   ├── jobs/
│   │   │   ├── __init__.py
│   │   │   ├── overdue_checker.py            # Daily: detect overdue payments — L2-6.4
│   │   │   ├── payment_reminder.py           # Daily: 3-day payment due reminders — L2-6.4
│   │   │   └── email_worker.py               # Async email dispatch — L2-11.1
│   │   │
│   │   │ ── Observability ───────────────────────────────────────
│   │   │
│   │   └── observability/
│   │       ├── __init__.py
│   │       ├── logging.py                    # Structured JSON logging — L2-11.2
│   │       ├── metrics.py                    # Latency, error rate, queue depth — L2-11.2
│   │       └── health.py                     # /health, /ready endpoints — L2-11.3
│   │
│   │ ── Database Migrations ─────────────────────────────────────
│   │
│   ├── migrations/
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   │       ├── 001_initial_users_roles.py
│   │       ├── 002_loans.py
│   │       ├── 003_payments_changelog.py
│   │       ├── 004_notifications_activity.py
│   │       ├── 005_audit_log.py
│   │       └── 006_refresh_tokens.py
│   │
│   │ ── Backend Tests ───────────────────────────────────────────
│   │
│   └── tests/
│       ├── conftest.py                       # Fixtures: app, db session, test client, auth helpers
│       ├── factories.py                      # Factory Boy factories for User, Loan, Payment, etc.
│       │
│       ├── unit/
│       │   ├── services/
│       │   │   ├── test_auth_service.py
│       │   │   ├── test_password_service.py
│       │   │   ├── test_token_service.py
│       │   │   ├── test_user_service.py
│       │   │   ├── test_role_service.py
│       │   │   ├── test_loan_service.py
│       │   │   ├── test_schedule_service.py
│       │   │   ├── test_payment_service.py
│       │   │   ├── test_balance_service.py
│       │   │   ├── test_dashboard_service.py
│       │   │   ├── test_notification_service.py
│       │   │   └── test_audit_service.py
│       │   └── models/
│       │       ├── test_user_model.py
│       │       ├── test_loan_model.py
│       │       └── test_payment_model.py
│       │
│       ├── integration/
│       │   ├── test_auth_endpoints.py        # Login, signup, refresh, logout — L2-1.1–L2-1.5
│       │   ├── test_user_endpoints.py        # User CRUD, role assignment — L2-2.1–L2-2.5
│       │   ├── test_role_endpoints.py        # Role/permission management — L2-2.3
│       │   ├── test_loan_endpoints.py        # Loan CRUD, borrower restrictions — L2-3.1–L2-3.5
│       │   ├── test_payment_endpoints.py     # Record, reschedule, pause — L2-4.1–L2-4.7
│       │   ├── test_dashboard_endpoints.py   # Summary, loans, activity — L2-5.1–L2-5.4
│       │   ├── test_notification_endpoints.py # List, count, mark read — L2-6.1–L2-6.5
│       │   ├── test_rate_limiting.py         # Rate limit enforcement — L2-8.2
│       │   ├── test_idempotency.py           # Duplicate payment prevention — L2-9.3
│       │   └── test_migrations.py            # Migration up/down validation — L2-11.4
│       │
│       └── security/
│           ├── test_auth_enumeration.py      # No user enumeration leaks — L2-1.5
│           ├── test_session_revocation.py    # Session invalidation on deactivation — L2-1.4
│           ├── test_role_enforcement.py      # RBAC on all endpoints — L2-2.5
│           └── test_security_headers.py      # CSP, HSTS headers present — L2-8.3
│
│
│ ═══════════════════════════════════════════════════
│  FRONTEND — React / TypeScript
│ ═══════════════════════════════════════════════════
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── index.html
│   ├── .env.example                          # VITE_API_BASE_URL, etc.
│   │
│   ├── public/
│   │   └── favicon.svg
│   │
│   ├── src/
│   │   ├── main.tsx                          # React root, providers
│   │   ├── App.tsx                           # Router + layout wrapper
│   │   ├── routes.tsx                        # Route definitions with lazy loading
│   │   ├── vite-env.d.ts
│   │   │
│   │   │ ── API Client & Shared Types ───────────────────────────
│   │   │
│   │   ├── api/
│   │   │   ├── client.ts                     # Axios instance, auth interceptor, token refresh — L2-1.4
│   │   │   └── types.ts                      # User, Role, Loan, Payment, Notification, enums, PaginatedResponse, ApiError
│   │   │
│   │   │ ── Auth Module ─────────────────────────────────────────
│   │   │
│   │   ├── auth/
│   │   │   ├── AuthContext.tsx               # AuthProvider, login/logout/refresh, user+roles state — L2-1.4, L2-10.1
│   │   │   ├── ProtectedRoute.tsx            # Role-based route guard — L2-10.1
│   │   │   ├── LoginPage.tsx                 # Two-panel login — L2-1.1
│   │   │   ├── SignUpPage.tsx                # Two-panel registration — L2-1.2
│   │   │   ├── ForgotPasswordPage.tsx        # Email form + success state — L2-1.3
│   │   │   ├── ResetPasswordPage.tsx         # Token + new password — L2-1.3
│   │   │   ├── schemas.ts                    # Zod schemas: loginSchema, signUpSchema, forgotPasswordSchema
│   │   │   └── hooks.ts                      # useAuth hook
│   │   │
│   │   │ ── Dashboard Module ────────────────────────────────────
│   │   │
│   │   ├── dashboard/
│   │   │   ├── DashboardPage.tsx             # Main dashboard layout — L2-5.1–L2-5.4
│   │   │   ├── SummaryCards.tsx              # 4 metric cards (lent out, owed, upcoming, overdue) — L2-5.1
│   │   │   ├── SummaryCard.tsx              # Single metric card component
│   │   │   ├── ActiveLoansPanel.tsx          # Tabbed creditor/borrower loan list — L2-5.2
│   │   │   ├── ActivityFeed.tsx              # Recent activity timeline — L2-5.3
│   │   │   ├── ActivityFeedItem.tsx          # Single activity entry
│   │   │   └── hooks.ts                      # useDashboardSummary, useDashboardLoans, useDashboardActivity
│   │   │
│   │   │ ── Loan Module ─────────────────────────────────────────
│   │   │
│   │   ├── loans/
│   │   │   ├── LoanListPage.tsx              # Creditor/borrower views with tabs — L2-3.1, L2-3.2
│   │   │   ├── LoanDetailPage.tsx            # Full loan info, schedule, history — L2-3.4
│   │   │   ├── CreateEditLoanModal.tsx       # Loan form modal — L2-3.3
│   │   │   ├── LoanTable.tsx                 # Desktop data table
│   │   │   ├── LoanCardList.tsx              # Mobile card list
│   │   │   ├── LoanSummaryCards.tsx          # Principal, paid, outstanding, next due — L2-3.4
│   │   │   ├── BorrowerSelect.tsx            # Searchable borrower dropdown — L2-3.3
│   │   │   ├── StatusBadge.tsx               # Active/Overdue/Paused/PaidOff badge — L2-3.1
│   │   │   ├── schemas.ts                    # Zod: createLoanSchema, updateLoanSchema
│   │   │   └── hooks.ts                      # useLoans, useLoanDetail, useCreateLoan, useUpdateLoan
│   │   │
│   │   │ ── Payment Module ──────────────────────────────────────
│   │   │
│   │   ├── payments/
│   │   │   ├── PaymentScheduleView.tsx       # Schedule table with actions — L2-4.1
│   │   │   ├── PaymentTimeline.tsx           # Chronological timeline view
│   │   │   ├── RecordPaymentDialog.tsx       # Record/lump-sum with balance preview — L2-4.4
│   │   │   ├── ReschedulePaymentDialog.tsx   # New date + reason — L2-4.2
│   │   │   ├── PausePaymentDialog.tsx        # Single/range pause — L2-4.3
│   │   │   ├── PaymentHistoryView.tsx        # History with change log — L2-4.5
│   │   │   ├── ChangeLogEntry.tsx            # Old→new value display
│   │   │   ├── schemas.ts                    # Zod: recordPaymentSchema, rescheduleSchema, pauseSchema
│   │   │   └── hooks.ts                      # usePaymentSchedule, useRecordPayment, useReschedulePayment, usePausePayments, usePaymentHistory
│   │   │
│   │   │ ── User Management Module ──────────────────────────────
│   │   │
│   │   ├── users/
│   │   │   ├── UserListPage.tsx              # User table/cards with search — L2-2.1
│   │   │   ├── UserTable.tsx                 # Desktop sortable table
│   │   │   ├── UserCardList.tsx              # Mobile card layout
│   │   │   ├── AddEditUserDialog.tsx         # Create/edit modal — L2-2.2
│   │   │   ├── DeleteUserDialog.tsx          # Confirmation dialog — L2-2.4
│   │   │   ├── RoleManagementPage.tsx        # Role list with permissions — L2-2.3
│   │   │   ├── RolePermissionEditor.tsx      # Toggle permissions on a role
│   │   │   ├── schemas.ts                    # Zod: createUserSchema, updateUserSchema
│   │   │   └── hooks.ts                      # useUsers, useCreateUser, useUpdateUser, useDeleteUser, useRoles, useUpdatePermissions
│   │   │
│   │   │ ── Notification Module ─────────────────────────────────
│   │   │
│   │   ├── notifications/
│   │   │   ├── NotificationBell.tsx          # Bell icon + unread badge — L2-6.1
│   │   │   ├── NotificationDropdown.tsx      # Dropdown panel — L2-6.1
│   │   │   ├── NotificationItem.tsx          # Single notification row
│   │   │   ├── NotificationListPage.tsx      # Full page with filters/date groups — L2-6.3
│   │   │   ├── NotificationDateGroup.tsx     # Today/Yesterday/Earlier sections
│   │   │   ├── NotificationPreferences.tsx   # Email preference toggles — L2-6.5
│   │   │   ├── ToastProvider.tsx             # Toast context + state management — L2-6.2
│   │   │   ├── ToastContainer.tsx            # Positioned toast stack
│   │   │   ├── ToastMessage.tsx              # Success/error/warning/info toast
│   │   │   └── hooks.ts                      # useUnreadCount, useNotifications, useMarkRead, useMarkAllRead, useToast
│   │   │
│   │   │ ── Shared UI Components (Design System) ────────────────
│   │   │
│   │   ├── ui/
│   │   │   ├── Button.tsx                    # Primary/secondary/destructive/ghost — L2-7.2
│   │   │   ├── Input.tsx                     # Text input with label, icon, error — L2-7.2
│   │   │   ├── Select.tsx                    # Dropdown select
│   │   │   ├── Textarea.tsx                  # Multi-line input
│   │   │   ├── Modal.tsx                     # Centered overlay / mobile full-screen — L2-7.3
│   │   │   ├── DataTable.tsx                 # Sortable table with responsive column hiding
│   │   │   ├── Badge.tsx                     # Colored status badges
│   │   │   ├── Card.tsx                      # White card container
│   │   │   ├── MetricCard.tsx                # Icon + label + value card
│   │   │   ├── SearchInput.tsx               # Debounced search field
│   │   │   ├── DatePicker.tsx                # Date selection input
│   │   │   ├── CurrencyInput.tsx             # Formatted currency input
│   │   │   ├── Pagination.tsx                # Page navigation
│   │   │   ├── EmptyState.tsx                # Icon + message + optional action — L2-7.5
│   │   │   ├── LoadingSkeleton.tsx           # Content placeholder — L2-7.5
│   │   │   ├── ErrorState.tsx                # Error message + retry — L2-7.5, L2-10.3
│   │   │   └── Toggle.tsx                    # On/off toggle switch
│   │   │
│   │   │ ── Layout & Navigation ─────────────────────────────────
│   │   │
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx                 # Shell: sidebar or bottom nav based on breakpoint — L2-7.1
│   │   │   ├── DesktopSidebar.tsx            # Fixed left sidebar (1280px+) — L2-7.1
│   │   │   ├── TabletSidebar.tsx             # Collapsible sidebar (768–1279px) — L2-7.1
│   │   │   ├── MobileBottomNav.tsx           # Bottom tab bar (<768px) — L2-7.1
│   │   │   ├── MobileHeader.tsx              # Top header for mobile/tablet
│   │   │   ├── NavItem.tsx                   # Active/default nav link
│   │   │   └── useBreakpoint.ts              # isMobile, isTablet, isDesktop hook
│   │   │
│   │   │ ── Utilities ───────────────────────────────────────────
│   │   │
│   │   └── utils/
│   │       ├── format.ts                     # Currency, date, relative time formatters — L2-9.1
│   │       ├── constants.ts                  # Route paths, query keys, breakpoints
│   │       └── test-utils.tsx                # Render with providers for unit tests
│   │
│   │ ── Frontend Unit / Component Tests ─────────────────────────
│   │
│   └── src/__tests__/
│       ├── auth/
│       │   ├── AuthContext.test.tsx
│       │   ├── LoginPage.test.tsx
│       │   ├── SignUpPage.test.tsx
│       │   └── ProtectedRoute.test.tsx
│       ├── dashboard/
│       │   ├── DashboardPage.test.tsx
│       │   └── SummaryCards.test.tsx
│       ├── loans/
│       │   ├── LoanListPage.test.tsx
│       │   ├── LoanDetailPage.test.tsx
│       │   └── CreateEditLoanModal.test.tsx
│       ├── payments/
│       │   ├── RecordPaymentDialog.test.tsx
│       │   ├── ReschedulePaymentDialog.test.tsx
│       │   └── PausePaymentDialog.test.tsx
│       ├── users/
│       │   ├── UserListPage.test.tsx
│       │   ├── AddEditUserDialog.test.tsx
│       │   └── DeleteUserDialog.test.tsx
│       ├── notifications/
│       │   ├── NotificationBell.test.tsx
│       │   ├── NotificationDropdown.test.tsx
│       │   └── ToastProvider.test.tsx
│       ├── layout/
│       │   ├── AppLayout.test.tsx
│       │   └── useBreakpoint.test.ts
│       └── ui/
│           ├── Button.test.tsx
│           ├── Modal.test.tsx
│           ├── DataTable.test.tsx
│           └── CurrencyInput.test.tsx
│
│
│ ═══════════════════════════════════════════════════
│  E2E TESTS — Playwright (Page Object Model)
│ ═══════════════════════════════════════════════════
│
├── e2e/
│   ├── package.json                          # Playwright + @playwright/test dependency
│   ├── playwright.config.ts                  # Base URL, browsers, viewport presets, projects
│   ├── tsconfig.json
│   │
│   │ ── Fixtures & Helpers ──────────────────────────────────────
│   │
│   ├── fixtures/
│   │   ├── auth.fixture.ts                   # Authenticated page fixture (logs in, stores state)
│   │   ├── roles.fixture.ts                  # Pre-seeded admin/creditor/borrower fixtures
│   │   ├── data.fixture.ts                   # Seed loans, payments, notifications via API
│   │   └── viewport.fixture.ts               # Desktop/tablet/mobile viewport presets
│   │
│   ├── helpers/
│   │   ├── api-client.ts                     # Direct API calls for test setup/teardown
│   │   ├── seed.ts                           # Database seed utilities (users, roles, loans)
│   │   └── wait.ts                           # Custom waitFor helpers (toasts, modals, navigation)
│   │
│   │ ── Page Objects ────────────────────────────────────────────
│   │
│   ├── pages/
│   │   │
│   │   │ ── Auth Pages ──────────────────────────────────────────
│   │   │
│   │   ├── LoginPage.ts
│   │   │   # Locators:
│   │   │   #   emailInput, passwordInput, signInButton, forgotPasswordLink,
│   │   │   #   signUpLink, rememberMeCheckbox, errorToast, brandLogo
│   │   │   # Actions:
│   │   │   #   goto(), login(email, password), getValidationError(field),
│   │   │   #   clickForgotPassword(), clickSignUp()
│   │   │   # Assertions:
│   │   │   #   expectVisible(), expectErrorMessage(msg), expectLoading(),
│   │   │   #   expectBrandVisible()
│   │   │
│   │   ├── SignUpPage.ts
│   │   │   # Locators:
│   │   │   #   nameInput, emailInput, passwordInput, confirmPasswordInput,
│   │   │   #   createAccountButton, signInLink
│   │   │   # Actions:
│   │   │   #   goto(), signUp(name, email, password, confirmPassword),
│   │   │   #   clickSignIn()
│   │   │   # Assertions:
│   │   │   #   expectVisible(), expectFieldError(field, msg),
│   │   │   #   expectSuccessState()
│   │   │
│   │   ├── ForgotPasswordPage.ts
│   │   │   # Locators:
│   │   │   #   emailInput, resetButton, backToLoginLink, successMessage
│   │   │   # Actions:
│   │   │   #   goto(), submitEmail(email), clickBackToLogin()
│   │   │   # Assertions:
│   │   │   #   expectVisible(), expectSuccessMessage(), expectFieldError(msg)
│   │   │
│   │   ├── ResetPasswordPage.ts
│   │   │   # Locators:
│   │   │   #   passwordInput, confirmPasswordInput, resetButton
│   │   │   # Actions:
│   │   │   #   goto(token), submitNewPassword(password, confirm)
│   │   │   # Assertions:
│   │   │   #   expectVisible(), expectSuccess(), expectTokenExpiredError()
│   │   │
│   │   │ ── Dashboard Page ──────────────────────────────────────
│   │   │
│   │   ├── DashboardPage.ts
│   │   │   # Locators:
│   │   │   #   pageTitle, welcomeMessage, summaryCards (totalLentOut,
│   │   │   #   totalOwed, upcomingPayments, overduePayments),
│   │   │   #   activeLoansCard, loansIGaveTab, loansIOweTab,
│   │   │   #   loanRows, activityFeed, activityItems, viewAllLink,
│   │   │   #   loadingSkeletons, errorStates, retryButtons
│   │   │   # Actions:
│   │   │   #   goto(), switchToLoansIGave(), switchToLoansIOwe(),
│   │   │   #   clickLoanRow(index), clickViewAll(), retrySection(name)
│   │   │   # Assertions:
│   │   │   #   expectSummaryCard(label, value), expectLoanCount(n),
│   │   │   #   expectActivityCount(n), expectLoading(), expectLoaded(),
│   │   │   #   expectSectionError(name)
│   │   │
│   │   │ ── User Management Pages ───────────────────────────────
│   │   │
│   │   ├── UserListPage.ts
│   │   │   # Locators:
│   │   │   #   pageTitle, addUserButton, searchInput, userTable,
│   │   │   #   userRows, userCards, pagination, sortHeaders,
│   │   │   #   editButtons, deleteButtons, roleBadges, statusBadges
│   │   │   # Actions:
│   │   │   #   goto(), search(query), clickAddUser(), clickEditUser(index),
│   │   │   #   clickDeleteUser(index), sortBy(column), goToPage(n)
│   │   │   # Assertions:
│   │   │   #   expectUserCount(n), expectUserInRow(index, name, email),
│   │   │   #   expectEmptyState(), expectSearchResults(count)
│   │   │
│   │   ├── AddEditUserDialog.ts
│   │   │   # Locators:
│   │   │   #   dialogContainer, titleText, nameInput, emailInput,
│   │   │   #   roleSelect, activeToggle, saveButton, cancelButton,
│   │   │   #   closeButton, fieldErrors
│   │   │   # Actions:
│   │   │   #   fillName(name), fillEmail(email), selectRoles(roles[]),
│   │   │   #   toggleActive(), clickSave(), clickCancel(), close()
│   │   │   # Assertions:
│   │   │   #   expectOpen(), expectClosed(), expectTitle(title),
│   │   │   #   expectFieldError(field, msg), expectSaving(),
│   │   │   #   expectPrefilledWith(user)
│   │   │
│   │   ├── DeleteUserDialog.ts
│   │   │   # Locators:
│   │   │   #   dialogContainer, warningIcon, titleText, confirmationMessage,
│   │   │   #   deleteButton, cancelButton
│   │   │   # Actions:
│   │   │   #   clickDelete(), clickCancel()
│   │   │   # Assertions:
│   │   │   #   expectOpen(), expectClosed(), expectUserName(name),
│   │   │   #   expectDeleting()
│   │   │
│   │   ├── RoleManagementPage.ts
│   │   │   # Locators:
│   │   │   #   roleCards, permissionChips, editButton
│   │   │   # Actions:
│   │   │   #   goto(), clickEditRole(roleName)
│   │   │   # Assertions:
│   │   │   #   expectRoleCount(n), expectPermissions(role, perms[])
│   │   │
│   │   │ ── Loan Pages ──────────────────────────────────────────
│   │   │
│   │   ├── LoanListPage.ts
│   │   │   # Locators:
│   │   │   #   pageTitle, createLoanButton, searchInput, statusFilter,
│   │   │   #   creditorTab, borrowerTab, loanTable, loanRows, loanCards,
│   │   │   #   statusBadges, pagination
│   │   │   # Actions:
│   │   │   #   goto(), gotoCreditorView(), gotoBorrowerView(),
│   │   │   #   search(query), filterByStatus(status), clickCreateLoan(),
│   │   │   #   clickLoanRow(index), goToPage(n)
│   │   │   # Assertions:
│   │   │   #   expectLoanCount(n), expectLoanInRow(index, data),
│   │   │   #   expectStatusBadge(index, status), expectEmptyState(),
│   │   │   #   expectCreateButtonVisible(), expectCreateButtonHidden()
│   │   │
│   │   ├── LoanDetailPage.ts
│   │   │   # Locators:
│   │   │   #   loanTitle, statusBadge, editLoanButton, recordPaymentButton,
│   │   │   #   summaryCards (principal, totalPaid, outstanding, nextPayment),
│   │   │   #   loanInfoCard, paymentScheduleCard, paymentHistorySection,
│   │   │   #   backButton
│   │   │   # Actions:
│   │   │   #   goto(loanId), clickEditLoan(), clickRecordPayment(),
│   │   │   #   clickBack()
│   │   │   # Assertions:
│   │   │   #   expectTitle(title), expectStatus(status),
│   │   │   #   expectSummaryCard(label, value), expectPaymentCount(n),
│   │   │   #   expectBorrowerRestrictions()
│   │   │
│   │   ├── CreateEditLoanModal.ts
│   │   │   # Locators:
│   │   │   #   dialogContainer, titleText, borrowerSelect, descriptionInput,
│   │   │   #   principalInput, interestRateInput, frequencySelect,
│   │   │   #   startDateInput, notesTextarea, saveButton, cancelButton,
│   │   │   #   closeButton, fieldErrors, borrowerSearchInput,
│   │   │   #   borrowerOptions
│   │   │   # Actions:
│   │   │   #   selectBorrower(name), fillDescription(text),
│   │   │   #   fillPrincipal(amount), fillInterestRate(rate),
│   │   │   #   selectFrequency(freq), fillStartDate(date),
│   │   │   #   fillNotes(text), clickSave(), clickCancel(), close()
│   │   │   # Assertions:
│   │   │   #   expectOpen(), expectClosed(), expectTitle(title),
│   │   │   #   expectFieldError(field, msg), expectSaving(),
│   │   │   #   expectPrincipalReadOnly()
│   │   │
│   │   │ ── Payment Dialogs ─────────────────────────────────────
│   │   │
│   │   ├── RecordPaymentDialog.ts
│   │   │   # Locators:
│   │   │   #   dialogContainer, titleText, scheduledInfo, amountInput,
│   │   │   #   dateInput, methodSelect, notesInput, balancePreview,
│   │   │   #   recordButton, cancelButton, closeButton
│   │   │   # Actions:
│   │   │   #   fillAmount(amount), fillDate(date), selectMethod(method),
│   │   │   #   fillNotes(text), clickRecord(), clickCancel(), close()
│   │   │   # Assertions:
│   │   │   #   expectOpen(), expectClosed(), expectPrefilledAmount(amount),
│   │   │   #   expectBalancePreview(value), expectRecording(),
│   │   │   #   expectFieldError(field, msg)
│   │   │
│   │   ├── ReschedulePaymentDialog.ts
│   │   │   # Locators:
│   │   │   #   dialogContainer, titleText, currentPaymentInfo, newDateInput,
│   │   │   #   reasonTextarea, rescheduleButton, cancelButton, closeButton
│   │   │   # Actions:
│   │   │   #   fillNewDate(date), fillReason(text),
│   │   │   #   clickReschedule(), clickCancel(), close()
│   │   │   # Assertions:
│   │   │   #   expectOpen(), expectClosed(),
│   │   │   #   expectCurrentDate(date), expectCurrentAmount(amount),
│   │   │   #   expectRescheduling(), expectFieldError(field, msg)
│   │   │
│   │   ├── PausePaymentDialog.ts
│   │   │   # Locators:
│   │   │   #   dialogContainer, titleText, warningInfo, paymentInfo,
│   │   │   #   reasonTextarea, pauseButton, cancelButton, closeButton
│   │   │   # Actions:
│   │   │   #   fillReason(text), clickPause(), clickCancel(), close()
│   │   │   # Assertions:
│   │   │   #   expectOpen(), expectClosed(), expectWarningVisible(),
│   │   │   #   expectPaymentDate(date), expectPausing()
│   │   │
│   │   ├── PaymentScheduleSection.ts
│   │   │   # Locators:
│   │   │   #   scheduleTable, paymentRows, statusBadges,
│   │   │   #   recordButtons, rescheduleButtons, pauseButtons,
│   │   │   #   rescheduledOriginalDate, resumeButtons
│   │   │   # Actions:
│   │   │   #   clickRecordPayment(rowIndex), clickReschedule(rowIndex),
│   │   │   #   clickPause(rowIndex), clickResume(rowIndex)
│   │   │   # Assertions:
│   │   │   #   expectPaymentCount(n), expectPaymentStatus(index, status),
│   │   │   #   expectOriginalDateStrikethrough(index, date),
│   │   │   #   expectActionsForStatus(index, status)
│   │   │
│   │   ├── PaymentHistorySection.ts
│   │   │   # Locators:
│   │   │   #   historyList, historyEntries, filterDropdown, entryIcons,
│   │   │   #   entryDescriptions, entryTimestamps, changeDetails
│   │   │   # Actions:
│   │   │   #   filterByType(type)
│   │   │   # Assertions:
│   │   │   #   expectEntryCount(n), expectEntry(index, description),
│   │   │   #   expectChangeDetail(index, oldVal, newVal)
│   │   │
│   │   │ ── Notification Components ─────────────────────────────
│   │   │
│   │   ├── NotificationBell.ts
│   │   │   # Locators:
│   │   │   #   bellIcon, unreadBadge
│   │   │   # Actions:
│   │   │   #   click()
│   │   │   # Assertions:
│   │   │   #   expectBadgeCount(n), expectNoBadge()
│   │   │
│   │   ├── NotificationDropdown.ts
│   │   │   # Locators:
│   │   │   #   dropdownContainer, headerTitle, unreadBadge,
│   │   │   #   markAllReadLink, notificationItems, unreadItems,
│   │   │   #   readItems, viewAllLink, itemIcons, itemMessages,
│   │   │   #   itemTimestamps
│   │   │   # Actions:
│   │   │   #   clickMarkAllRead(), clickViewAll(),
│   │   │   #   clickNotification(index)
│   │   │   # Assertions:
│   │   │   #   expectOpen(), expectClosed(), expectItemCount(n),
│   │   │   #   expectUnreadCount(n), expectNotificationText(index, text)
│   │   │
│   │   ├── NotificationListPage.ts
│   │   │   # Locators:
│   │   │   #   pageTitle, markAllReadButton, filterTabs, dateGroups,
│   │   │   #   notificationItems, pagination, emptyState
│   │   │   # Actions:
│   │   │   #   goto(), filterByType(type), clickMarkAllRead(),
│   │   │   #   clickNotification(index), goToPage(n)
│   │   │   # Assertions:
│   │   │   #   expectVisible(), expectItemCount(n),
│   │   │   #   expectDateGroup(label, count), expectEmptyState(),
│   │   │   #   expectAllRead()
│   │   │
│   │   │ ── Toast Component ─────────────────────────────────────
│   │   │
│   │   ├── ToastComponent.ts
│   │   │   # Locators:
│   │   │   #   toastContainer, toasts, successToasts, errorToasts,
│   │   │   #   warningToasts, infoToasts, closeButtons, messages
│   │   │   # Actions:
│   │   │   #   closeToast(index), waitForToast(type)
│   │   │   # Assertions:
│   │   │   #   expectToast(type, message), expectToastCount(n),
│   │   │   #   expectAutoDismiss(timeout), expectNoToasts()
│   │   │
│   │   │ ── Navigation Components ───────────────────────────────
│   │   │
│   │   ├── SidebarNav.ts
│   │   │   # Locators:
│   │   │   #   sidebar, logo, navItems (dashboard, loans, borrowings,
│   │   │   #   users, notifications, settings), activeItem, userAvatar
│   │   │   # Actions:
│   │   │   #   clickNavItem(label)
│   │   │   # Assertions:
│   │   │   #   expectVisible(), expectHidden(), expectActiveItem(label),
│   │   │   #   expectNavItemHidden(label)
│   │   │
│   │   ├── TabletSidebarNav.ts
│   │   │   # Locators:
│   │   │   #   hamburgerButton, sidebarOverlay, backdrop, navItems
│   │   │   # Actions:
│   │   │   #   open(), close(), clickNavItem(label)
│   │   │   # Assertions:
│   │   │   #   expectOpen(), expectClosed(), expectActiveItem(label)
│   │   │
│   │   └── MobileBottomNavBar.ts
│   │       # Locators:
│   │       #   bottomBar, tabs (home, loans, owed, alerts, more),
│   │       #   activeTab, moreMenu, moreMenuItems
│   │       # Actions:
│   │       #   clickTab(label), openMoreMenu(), clickMoreItem(label)
│   │       # Assertions:
│   │       #   expectVisible(), expectActiveTab(label),
│   │       #   expectMoreMenuOpen(), expectMoreMenuClosed()
│   │
│   │ ── Test Specs ──────────────────────────────────────────────
│   │
│   └── tests/
│       │
│       │ ── Authentication ──────────────────────────────────────
│       │
│       ├── auth/
│       │   ├── login.spec.ts
│       │   │   # L2-1.1: Login Screen
│       │   │   #   - displays login form with all required elements
│       │   │   #   - shows brand logo and tagline
│       │   │   #   - logs in with valid credentials and redirects to dashboard
│       │   │   #   - shows error toast on invalid credentials
│       │   │   #   - shows inline validation for empty email
│       │   │   #   - shows inline validation for empty password
│       │   │   #   - shows loading state on sign-in button during submission
│       │   │   #   - disables form inputs during submission
│       │   │   #   - navigates to sign-up page via link
│       │   │   #   - navigates to forgot-password page via link
│       │   │   #   - shows network error toast on connection failure
│       │   │   #   - redirects authenticated user away from login page
│       │   │
│       │   ├── signup.spec.ts
│       │   │   # L2-1.2: Sign-Up Screen
│       │   │   #   - displays sign-up form with all required fields
│       │   │   #   - successfully creates account with valid data
│       │   │   #   - shows success state after registration
│       │   │   #   - shows error for duplicate email (409)
│       │   │   #   - validates required fields (name, email, password, confirm)
│       │   │   #   - validates email format
│       │   │   #   - validates password minimum length
│       │   │   #   - validates password confirmation match
│       │   │   #   - navigates to login page via sign-in link
│       │   │   #   - shows loading state during submission
│       │   │
│       │   ├── forgot-password.spec.ts
│       │   │   # L2-1.3: Forgot Password Screen
│       │   │   #   - displays forgot-password form
│       │   │   #   - submits email and shows success confirmation
│       │   │   #   - shows success even for non-existent email (no enumeration)
│       │   │   #   - validates empty email field
│       │   │   #   - validates email format
│       │   │   #   - navigates back to login via link
│       │   │   #   - shows loading state during submission
│       │   │
│       │   ├── reset-password.spec.ts
│       │   │   # L2-1.3: Reset Password (token-based)
│       │   │   #   - displays reset form when valid token in URL
│       │   │   #   - resets password and shows success
│       │   │   #   - shows error for expired/invalid token
│       │   │   #   - validates password and confirm-password match
│       │   │   #   - validates minimum password length
│       │   │
│       │   └── session.spec.ts
│       │       # L2-1.4: Session Security & Revocation
│       │       #   - redirects to login when access token expires
│       │       #   - silently refreshes token and retries request on 401
│       │       #   - redirects to login when refresh token is expired
│       │       #   - logout clears tokens and redirects to login
│       │       #   - protected routes redirect unauthenticated users to login
│       │       #   - preserves return URL after login redirect
│       │       #   - prevents flash of protected content during auth check
│       │
│       │ ── User Management ─────────────────────────────────────
│       │
│       ├── users/
│       │   ├── user-list.spec.ts
│       │   │   # L2-2.1: User List Screen
│       │   │   #   - displays user table with name, email, roles, status, actions
│       │   │   #   - shows "Add User" button for admins
│       │   │   #   - searches users by name and filters results
│       │   │   #   - searches users by email and filters results
│       │   │   #   - paginates through user list
│       │   │   #   - sorts table by column headers
│       │   │   #   - shows empty state when no users match search
│       │   │   #   - denies access to non-admin users (redirect to 403)
│       │   │
│       │   ├── add-edit-user.spec.ts
│       │   │   # L2-2.2: Add/Edit User Dialog
│       │   │   #   - opens add-user modal with empty form
│       │   │   #   - creates user with name, email, roles, active status
│       │   │   #   - shows success toast after creating user
│       │   │   #   - refreshes user list after creating user
│       │   │   #   - opens edit-user modal pre-filled with user data
│       │   │   #   - updates user and shows success toast
│       │   │   #   - validates required fields (name, email, roles)
│       │   │   #   - shows inline error for duplicate email
│       │   │   #   - closes modal on cancel without saving
│       │   │   #   - closes modal on X button
│       │   │   #   - shows loading/saving state on save button
│       │   │   #   - toggles active/inactive status
│       │   │
│       │   ├── delete-user.spec.ts
│       │   │   # L2-2.4: Delete User Confirmation Dialog
│       │   │   #   - opens confirmation dialog with user name
│       │   │   #   - displays warning icon and destructive styling
│       │   │   #   - explains that access is revoked and records preserved
│       │   │   #   - deactivates user on confirm and shows success toast
│       │   │   #   - refreshes user list after deletion
│       │   │   #   - closes dialog on cancel without deleting
│       │   │   #   - shows loading state during deletion
│       │   │
│       │   └── role-management.spec.ts
│       │       # L2-2.3: Role Management Screen
│       │       #   - displays all roles with descriptions
│       │       #   - shows permission chips for each role
│       │       #   - edits permissions on a role and saves
│       │       #   - restricts to admin-only access
│       │
│       │ ── Loan Management ─────────────────────────────────────
│       │
│       ├── loans/
│       │   ├── loan-list-creditor.spec.ts
│       │   │   # L2-3.1: Loans List Screen (Creditor View)
│       │   │   #   - displays creditor loans in table with all columns
│       │   │   #   - shows "Create New Loan" button
│       │   │   #   - displays status badges with correct colors
│       │   │   #   - searches loans by borrower name
│       │   │   #   - filters loans by status (Active, Paused, Overdue, Paid Off)
│       │   │   #   - navigates to loan detail on row click
│       │   │   #   - paginates through loan list
│       │   │   #   - shows empty state when no loans exist
│       │   │
│       │   ├── loan-list-borrower.spec.ts
│       │   │   # L2-3.2: Loans List Screen (Borrower View)
│       │   │   #   - displays borrower loans with creditor name column
│       │   │   #   - hides "Create New Loan" button for borrowers
│       │   │   #   - shows principal as non-editable
│       │   │   #   - shows borrower-specific actions (View, Make Payment)
│       │   │   #   - navigates to loan detail on row click
│       │   │
│       │   ├── create-loan.spec.ts
│       │   │   # L2-3.3: Create/Edit Loan Form
│       │   │   #   - opens create-loan modal from loan list
│       │   │   #   - searches and selects a borrower
│       │   │   #   - fills all loan fields (description, principal, rate, frequency, date, notes)
│       │   │   #   - creates loan and shows success toast
│       │   │   #   - navigates to new loan detail after creation
│       │   │   #   - validates required fields
│       │   │   #   - validates principal is positive
│       │   │   #   - validates start date is not in the past
│       │   │   #   - closes modal on cancel
│       │   │   #   - shows loading state during save
│       │   │
│       │   ├── edit-loan.spec.ts
│       │   │   # L2-3.3, L2-3.5: Edit Loan + Borrower Restrictions
│       │   │   #   - opens edit modal pre-filled with loan data
│       │   │   #   - creditor can edit all fields
│       │   │   #   - borrower sees principal as read-only
│       │   │   #   - borrower sees creditor-controlled terms as non-editable
│       │   │   #   - saves changes and shows success toast
│       │   │   #   - shows validation errors for invalid data
│       │   │
│       │   └── loan-detail.spec.ts
│       │       # L2-3.4: Loan Detail Screen
│       │       #   - displays loan title, status badge, and back button
│       │       #   - displays 4 summary cards with correct values
│       │       #   - displays loan information card with all fields
│       │       #   - displays payment schedule section
│       │       #   - displays payment history section
│       │       #   - shows terms/change history
│       │       #   - shows "Edit Loan" button for creditor
│       │       #   - shows "Record Payment" button
│       │       #   - shows contextual actions based on user role
│       │       #   - navigates back to loan list on back click
│       │
│       │ ── Payment Tracking ────────────────────────────────────
│       │
│       ├── payments/
│       │   ├── payment-schedule.spec.ts
│       │   │   # L2-4.1: Payment Schedule View
│       │   │   #   - displays all scheduled payments with date, amount, status
│       │   │   #   - shows correct status badges (Scheduled, Paid, Paused, Rescheduled, Overdue)
│       │   │   #   - shows original date with strikethrough for rescheduled payments
│       │   │   #   - shows paused payments as visually distinct
│       │   │   #   - shows partial payments as distinct from fully paid
│       │   │   #   - shows contextual action buttons per payment status
│       │   │   #   - hides reschedule/pause on already paid payments
│       │   │
│       │   ├── record-payment.spec.ts
│       │   │   # L2-4.4: Record Payment / Lump Sum Dialog
│       │   │   #   - opens record-payment dialog from schedule row
│       │   │   #   - pre-fills amount from scheduled payment
│       │   │   #   - shows scheduled payment info (date + amount)
│       │   │   #   - calculates and displays live balance preview
│       │   │   #   - records exact scheduled amount
│       │   │   #   - records partial payment (less than scheduled)
│       │   │   #   - records lump-sum payment (more than scheduled)
│       │   │   #   - shows lump-sum allocation note
│       │   │   #   - updates loan status to Paid Off when balance reaches zero
│       │   │   #   - shows success toast after recording
│       │   │   #   - refreshes schedule and loan detail after recording
│       │   │   #   - validates amount is positive
│       │   │   #   - validates date is required
│       │   │   #   - prevents duplicate submission (disables button)
│       │   │   #   - closes dialog on cancel
│       │   │
│       │   ├── reschedule-payment.spec.ts
│       │   │   # L2-4.2: Reschedule Payment Dialog
│       │   │   #   - opens reschedule dialog from schedule row
│       │   │   #   - displays current payment date and amount
│       │   │   #   - selects a new date
│       │   │   #   - enters optional reason
│       │   │   #   - reschedules payment and shows success toast
│       │   │   #   - shows original date with strikethrough in schedule after reschedule
│       │   │   #   - updates payment status to Rescheduled
│       │   │   #   - validates new date is in the future
│       │   │   #   - closes dialog on cancel
│       │   │
│       │   ├── pause-payment.spec.ts
│       │   │   # L2-4.3: Pause Payment Dialog
│       │   │   #   - opens pause dialog from schedule row
│       │   │   #   - displays warning about pause behavior
│       │   │   #   - displays payment details being paused
│       │   │   #   - pauses payment with optional reason
│       │   │   #   - shows success toast after pausing
│       │   │   #   - updates payment status to Paused in schedule
│       │   │   #   - can resume a paused payment
│       │   │   #   - closes dialog on cancel
│       │   │
│       │   └── payment-history.spec.ts
│       │       # L2-4.5: Payment History with Change Log
│       │       #   - displays payment history timeline
│       │       #   - shows payment entries with amount, date, status
│       │       #   - shows reschedule entries with old/new dates
│       │       #   - shows pause entries with reason
│       │       #   - shows who made each change and when
│       │       #   - filters history by type (Payment, Reschedule, Pause)
│       │       #   - distinguishes payments from modifications visually
│       │
│       │ ── Dashboard ───────────────────────────────────────────
│       │
│       ├── dashboard/
│       │   ├── summary-cards.spec.ts
│       │   │   # L2-5.1: Dashboard — Summary Cards
│       │   │   #   - displays 4 summary metric cards
│       │   │   #   - shows Total Lent Out with currency formatting
│       │   │   #   - shows Total Owed with currency formatting
│       │   │   #   - shows Upcoming Payments count (next 7 days)
│       │   │   #   - shows Overdue Payments count with warning styling
│       │   │   #   - updates values after recording a payment
│       │   │
│       │   ├── active-loans.spec.ts
│       │   │   # L2-5.2: Dashboard — Active Loans Table
│       │   │   #   - displays active loans panel with tabs
│       │   │   #   - "Loans I Gave" tab shows creditor loans
│       │   │   #   - "Loans I Owe" tab shows borrower loans
│       │   │   #   - each loan shows person, amount, next due, status
│       │   │   #   - clicking View navigates to loan detail
│       │   │   #   - switches between tabs and updates content
│       │   │
│       │   ├── activity-feed.spec.ts
│       │   │   # L2-5.3: Dashboard — Recent Activity Feed
│       │   │   #   - displays recent activity items
│       │   │   #   - shows event icons with correct colors
│       │   │   #   - shows event descriptions and timestamps
│       │   │   #   - shows "View All" link
│       │   │   #   - clicking View All navigates to full activity page
│       │   │
│       │   ├── dashboard-loading.spec.ts
│       │   │   # L2-5.4: Dashboard Freshness & Failure Handling
│       │   │   #   - shows loading skeletons for all sections
│       │   │   #   - loads sections independently (parallel fetching)
│       │   │   #   - shows error state with retry for failed section
│       │   │   #   - retrying a failed section refetches data
│       │   │   #   - other sections remain functional when one fails
│       │   │
│       │   └── dashboard-navigation.spec.ts
│       │       #   - redirects to dashboard after login
│       │       #   - dashboard is accessible from sidebar nav
│       │       #   - welcome message shows current user name
│       │
│       │ ── Notifications ───────────────────────────────────────
│       │
│       ├── notifications/
│       │   ├── notification-bell.spec.ts
│       │   │   # L2-6.1: Notification Bell & Dropdown
│       │   │   #   - displays bell icon in header
│       │   │   #   - shows unread count badge when notifications exist
│       │   │   #   - hides badge when all notifications are read
│       │   │   #   - opens dropdown on bell click
│       │   │   #   - dropdown shows recent notifications
│       │   │   #   - unread notifications have distinct background
│       │   │   #   - read notifications have normal background
│       │   │   #   - clicking "Mark all as read" clears badge
│       │   │   #   - clicking a notification navigates to related loan
│       │   │   #   - clicking "View all" navigates to full notifications page
│       │   │   #   - dropdown closes on outside click
│       │   │
│       │   ├── notification-list.spec.ts
│       │   │   # L2-6.3: Full Notifications Screen
│       │   │   #   - displays all notifications grouped by date
│       │   │   #   - shows Today, Yesterday, and Earlier groups
│       │   │   #   - filters by type (Payments, Overdue, Schedule Changes, System)
│       │   │   #   - marks individual notification as read
│       │   │   #   - marks all notifications as read
│       │   │   #   - paginates through notifications
│       │   │   #   - shows empty state when no notifications
│       │   │   #   - each notification shows icon, message, timestamp
│       │   │
│       │   ├── toast-notifications.spec.ts
│       │   │   # L2-6.2: Notification Types & Toast Messages
│       │   │   #   - shows success toast after recording payment
│       │   │   #   - shows success toast after creating user
│       │   │   #   - shows success toast after creating loan
│       │   │   #   - shows error toast on failed API request
│       │   │   #   - shows warning toast for overdue notification
│       │   │   #   - toast auto-dismisses after 5 seconds
│       │   │   #   - toast can be manually dismissed via close button
│       │   │   #   - multiple toasts stack vertically
│       │   │
│       │   └── notification-preferences.spec.ts
│       │       # L2-6.5: Notification Preferences
│       │       #   - displays email preference toggles by category
│       │       #   - toggles email on/off for a notification type
│       │       #   - preference changes take effect immediately
│       │       #   - in-app notifications remain regardless of email setting
│       │
│       │ ── Responsive Design ───────────────────────────────────
│       │
│       ├── responsive/
│       │   ├── navigation-desktop.spec.ts
│       │   │   # L2-7.1: Responsive Navigation — Desktop
│       │   │   #   - shows fixed sidebar on desktop viewport
│       │   │   #   - sidebar has all nav items (Dashboard, Loans, Borrowings, Users, Notifications, Settings)
│       │   │   #   - highlights active nav item
│       │   │   #   - hides Users nav for non-admin users
│       │   │   #   - clicking nav item navigates to correct page
│       │   │
│       │   ├── navigation-tablet.spec.ts
│       │   │   # L2-7.1: Responsive Navigation — Tablet
│       │   │   #   - hides sidebar by default on tablet viewport
│       │   │   #   - shows hamburger menu in header
│       │   │   #   - opens sidebar overlay on hamburger click
│       │   │   #   - closes sidebar on backdrop click
│       │   │   #   - closes sidebar after nav item click
│       │   │   #   - highlights active nav item
│       │   │
│       │   ├── navigation-mobile.spec.ts
│       │   │   # L2-7.1: Responsive Navigation — Mobile
│       │   │   #   - shows bottom tab bar on mobile viewport
│       │   │   #   - displays 5 tabs (Home, Loans, Owed, Alerts, More)
│       │   │   #   - highlights active tab
│       │   │   #   - More tab opens overflow menu (Users, Settings, Logout)
│       │   │   #   - navigates correctly from each tab
│       │   │   #   - shows mobile header with logo, bell, and avatar
│       │   │
│       │   ├── responsive-forms.spec.ts
│       │   │   # L2-7.2: Responsive Button & Form Components
│       │   │   #   - buttons have 44px minimum touch target on mobile
│       │   │   #   - login form adapts to mobile (single column, no left panel)
│       │   │   #   - create-loan modal is full-screen on mobile
│       │   │   #   - two-column form rows stack to single column on mobile
│       │   │   #   - input fields are full-width on mobile
│       │   │
│       │   ├── responsive-dialogs.spec.ts
│       │   │   # L2-7.3: Responsive Dialog & Modal Components
│       │   │   #   - modals show as centered overlay on desktop
│       │   │   #   - modals show as full-screen on mobile
│       │   │   #   - modal has scrollable content area
│       │   │   #   - modal close button is always accessible
│       │   │   #   - dialog backdrop click closes on desktop
│       │   │
│       │   ├── responsive-dashboard.spec.ts
│       │   │   # L2-5.1, L2-7.1: Dashboard responsive layouts
│       │   │   #   - desktop: 4 metric cards in a row
│       │   │   #   - tablet: 2x2 metric card grid
│       │   │   #   - mobile: stacked metric cards
│       │   │   #   - desktop: active loans as data table
│       │   │   #   - mobile: active loans as card list
│       │   │
│       │   └── responsive-tables.spec.ts
│       │       # L2-2.1, L2-3.1: Responsive table/card layouts
│       │       #   - desktop: user list as data table
│       │       #   - mobile: user list as card list
│       │       #   - desktop: loan list as data table
│       │       #   - mobile: loan list as card list
│       │
│       │ ── Accessibility ───────────────────────────────────────
│       │
│       ├── accessibility/
│       │   ├── keyboard-navigation.spec.ts
│       │   │   # L2-7.4: Accessible Interaction & Keyboard Support
│       │   │   #   - tab navigates through login form fields
│       │   │   #   - enter submits login form
│       │   │   #   - escape closes modals
│       │   │   #   - modal traps focus inside
│       │   │   #   - modal restores focus on close
│       │   │   #   - visible focus indicators on all interactive elements
│       │   │   #   - logical tab order in forms
│       │   │
│       │   └── states.spec.ts
│       │       # L2-7.5: Loading, Empty, Error, and Success States
│       │       #   - dashboard shows loading skeletons
│       │       #   - loan list shows empty state
│       │       #   - user list shows empty state for search with no results
│       │       #   - notification list shows empty state
│       │       #   - error states show retry action
│       │       #   - forms show field-level error states
│       │       #   - successful actions show feedback (toast or state change)
│       │
│       │ ── Security (Client-Side) ──────────────────────────────
│       │
│       ├── security/
│       │   ├── route-protection.spec.ts
│       │   │   # L2-10.1: Client Route Protection
│       │   │   #   - unauthenticated user is redirected to login for all protected routes
│       │   │   #   - non-admin user is redirected to 403 for /users
│       │   │   #   - authenticated user is redirected away from /login
│       │   │   #   - page refresh re-establishes session
│       │   │   #   - no flash of protected content during initial load
│       │   │
│       │   └── session-handling.spec.ts
│       │       # L2-1.4, L2-8.1: Session Security
│       │       #   - expired session redirects to login
│       │       #   - token refresh happens silently on 401
│       │       #   - failed refresh redirects to login
│       │       #   - logout clears all stored tokens
│       │       #   - concurrent requests share single token refresh
│       │
│       │ ── Cross-Feature Integration ───────────────────────────
│       │
│       └── integration/
│           ├── loan-payment-flow.spec.ts
│           │   # End-to-end: full loan lifecycle
│           │   #   - creditor creates a loan
│           │   #   - borrower views loan in their borrowings list
│           │   #   - borrower records a payment
│           │   #   - dashboard summary updates after payment
│           │   #   - payment appears in payment history
│           │   #   - notification is created for creditor
│           │   #   - creditor records remaining payments until paid off
│           │   #   - loan status changes to Paid Off
│           │
│           ├── reschedule-pause-flow.spec.ts
│           │   # End-to-end: schedule modification flow
│           │   #   - borrower reschedules a payment
│           │   #   - original date appears with strikethrough
│           │   #   - creditor is notified of schedule change
│           │   #   - borrower pauses a payment
│           │   #   - paused payment shown as distinct in schedule
│           │   #   - borrower resumes paused payment
│           │   #   - all changes appear in payment history
│           │
│           ├── user-management-flow.spec.ts
│           │   # End-to-end: admin user management
│           │   #   - admin creates a new user with roles
│           │   #   - new user appears in user list
│           │   #   - admin edits user roles
│           │   #   - admin deactivates a user
│           │   #   - deactivated user cannot log in
│           │
│           └── notification-flow.spec.ts
│               # End-to-end: notification lifecycle
│               #   - payment due notification appears in bell dropdown
│               #   - overdue payment creates notification
│               #   - recording payment creates notification for counterparty
│               #   - marking all as read clears unread badge
│               #   - notification click navigates to related loan
│               #   - toast appears for real-time events
│
│
│ ═══════════════════════════════════════════════════
│  ROOT CONFIG
│ ═══════════════════════════════════════════════════
│
├── .gitignore
├── .github/
│   └── workflows/
│       ├── backend-ci.yml                    # Lint, test, migration check — L2-11.4
│       ├── frontend-ci.yml                   # Lint, type-check, unit tests — L2-11.4
│       ├── e2e-ci.yml                        # Playwright tests across browsers — L2-11.4
│       └── security-scan.yml                 # Dependency/security scanning — L2-11.4
│
├── docker-compose.yml                        # PostgreSQL, backend, frontend, Playwright
├── docker-compose.e2e.yml                    # E2E test environment with seeded data
├── Makefile                                  # dev, test, e2e, lint, migrate shortcuts
└── CLAUDE.md
```

---

## Playwright Configuration

### `e2e/playwright.config.ts` — Browser Projects & Viewports

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html"], ["list"]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    // Desktop browsers
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox-desktop",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit-desktop",
      use: { ...devices["Desktop Safari"] },
    },
    // Tablet viewport
    {
      name: "chromium-tablet",
      use: {
        ...devices["iPad (gen 7)"],
      },
    },
    // Mobile viewport
    {
      name: "chromium-mobile",
      use: {
        ...devices["iPhone 13"],
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    cwd: "../frontend",
  },
});
```

### Test Fixture Example — Authenticated Page

```typescript
// e2e/fixtures/auth.fixture.ts
import { test as base, Page } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

type AuthFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
  creditorPage: Page;
  borrowerPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("creditor@family.com", "password123");
    await page.waitForURL("/dashboard");
    await use(page);
  },
  adminPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("admin@family.com", "password123");
    await page.waitForURL("/dashboard");
    await use(page);
  },
  creditorPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("creditor@family.com", "password123");
    await page.waitForURL("/dashboard");
    await use(page);
  },
  borrowerPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("borrower@family.com", "password123");
    await page.waitForURL("/dashboard");
    await use(page);
  },
});

export { expect } from "@playwright/test";
```

### Page Object Example — LoginPage

```typescript
// e2e/pages/LoginPage.ts
import { type Locator, type Page, expect } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly signUpLink: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly brandLogo: Locator;
  readonly brandTagline: Locator;
  readonly errorToast: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel("Email Address");
    this.passwordInput = page.getByLabel("Password");
    this.signInButton = page.getByRole("button", { name: "Sign In" });
    this.forgotPasswordLink = page.getByRole("link", { name: "Forgot Password?" });
    this.signUpLink = page.getByRole("link", { name: "Sign Up" });
    this.rememberMeCheckbox = page.getByLabel("Remember me");
    this.brandLogo = page.getByText("LendQ").first();
    this.brandTagline = page.getByText("Family lending made simple");
    this.errorToast = page.locator("[data-testid='toast-error']");
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  async clickSignUp() {
    await this.signUpLink.click();
  }

  getValidationError(field: string) {
    return this.page.locator(`[data-testid='error-${field}']`);
  }

  async expectVisible() {
    await expect(this.signInButton).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
  }

  async expectBrandVisible() {
    await expect(this.brandLogo).toBeVisible();
    await expect(this.brandTagline).toBeVisible();
  }

  async expectErrorMessage(message: string) {
    await expect(this.errorToast).toContainText(message);
  }

  async expectLoading() {
    await expect(this.signInButton).toBeDisabled();
  }
}
```

### Page Object Example — DashboardPage

```typescript
// e2e/pages/DashboardPage.ts
import { type Locator, type Page, expect } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly welcomeMessage: Locator;
  readonly totalLentOut: Locator;
  readonly totalOwed: Locator;
  readonly upcomingPayments: Locator;
  readonly overduePayments: Locator;
  readonly loansIGaveTab: Locator;
  readonly loansIOweTab: Locator;
  readonly loanRows: Locator;
  readonly activityItems: Locator;
  readonly viewAllLink: Locator;
  readonly loadingSkeletons: Locator;
  readonly errorStates: Locator;
  readonly retryButtons: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByRole("heading", { name: "Dashboard" });
    this.welcomeMessage = page.getByText(/Welcome back/);
    this.totalLentOut = page.getByTestId("metric-total-lent-out");
    this.totalOwed = page.getByTestId("metric-total-owed");
    this.upcomingPayments = page.getByTestId("metric-upcoming-payments");
    this.overduePayments = page.getByTestId("metric-overdue-payments");
    this.loansIGaveTab = page.getByRole("tab", { name: "Loans I Gave" });
    this.loansIOweTab = page.getByRole("tab", { name: "Loans I Owe" });
    this.loanRows = page.locator("[data-testid='active-loan-row']");
    this.activityItems = page.locator("[data-testid='activity-item']");
    this.viewAllLink = page.getByRole("link", { name: "View All" });
    this.loadingSkeletons = page.locator("[data-testid='skeleton']");
    this.errorStates = page.locator("[data-testid='error-state']");
    this.retryButtons = page.getByRole("button", { name: "Retry" });
  }

  async goto() {
    await this.page.goto("/dashboard");
  }

  async switchToLoansIGave() {
    await this.loansIGaveTab.click();
  }

  async switchToLoansIOwe() {
    await this.loansIOweTab.click();
  }

  async clickLoanRow(index: number) {
    await this.loanRows.nth(index).click();
  }

  async clickViewAll() {
    await this.viewAllLink.click();
  }

  async retrySection(name: string) {
    await this.page.locator(`[data-testid='error-${name}'] button`).click();
  }

  async expectSummaryCard(testId: string, value: string) {
    await expect(this.page.getByTestId(testId)).toContainText(value);
  }

  async expectLoanCount(n: number) {
    await expect(this.loanRows).toHaveCount(n);
  }

  async expectActivityCount(n: number) {
    await expect(this.activityItems).toHaveCount(n);
  }

  async expectLoading() {
    await expect(this.loadingSkeletons.first()).toBeVisible();
  }

  async expectLoaded() {
    await expect(this.loadingSkeletons).toHaveCount(0);
  }

  async expectSectionError(name: string) {
    await expect(this.page.getByTestId(`error-${name}`)).toBeVisible();
  }
}
```

### Page Object Example — RecordPaymentDialog

```typescript
// e2e/pages/RecordPaymentDialog.ts
import { type Locator, type Page, expect } from "@playwright/test";

export class RecordPaymentDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly titleText: Locator;
  readonly scheduledInfo: Locator;
  readonly amountInput: Locator;
  readonly dateInput: Locator;
  readonly methodSelect: Locator;
  readonly notesInput: Locator;
  readonly balancePreview: Locator;
  readonly recordButton: Locator;
  readonly cancelButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole("dialog", { name: "Record Payment" });
    this.titleText = this.dialog.getByRole("heading", { name: "Record Payment" });
    this.scheduledInfo = this.dialog.getByTestId("scheduled-info");
    this.amountInput = this.dialog.getByLabel("Payment Amount");
    this.dateInput = this.dialog.getByLabel("Payment Date");
    this.methodSelect = this.dialog.getByLabel("Payment Method");
    this.notesInput = this.dialog.getByLabel(/Notes/);
    this.balancePreview = this.dialog.getByTestId("balance-preview");
    this.recordButton = this.dialog.getByRole("button", { name: "Record Payment" });
    this.cancelButton = this.dialog.getByRole("button", { name: "Cancel" });
    this.closeButton = this.dialog.getByRole("button", { name: "Close" });
  }

  async fillAmount(amount: string) {
    await this.amountInput.clear();
    await this.amountInput.fill(amount);
  }

  async fillDate(date: string) {
    await this.dateInput.fill(date);
  }

  async selectMethod(method: string) {
    await this.methodSelect.selectOption(method);
  }

  async fillNotes(text: string) {
    await this.notesInput.fill(text);
  }

  async clickRecord() {
    await this.recordButton.click();
  }

  async clickCancel() {
    await this.cancelButton.click();
  }

  async close() {
    await this.closeButton.click();
  }

  async expectOpen() {
    await expect(this.dialog).toBeVisible();
  }

  async expectClosed() {
    await expect(this.dialog).toBeHidden();
  }

  async expectPrefilledAmount(amount: string) {
    await expect(this.amountInput).toHaveValue(amount);
  }

  async expectBalancePreview(value: string) {
    await expect(this.balancePreview).toContainText(value);
  }

  async expectRecording() {
    await expect(this.recordButton).toBeDisabled();
  }

  async expectFieldError(field: string, message: string) {
    await expect(this.dialog.locator(`[data-testid='error-${field}']`)).toContainText(message);
  }
}
```

---

## Requirement Traceability

Every L2 requirement maps to at least one E2E test spec:

| Requirement | E2E Test Spec(s) |
|-------------|-------------------|
| L2-1.1 | `auth/login.spec.ts` |
| L2-1.2 | `auth/signup.spec.ts` |
| L2-1.3 | `auth/forgot-password.spec.ts`, `auth/reset-password.spec.ts` |
| L2-1.4 | `auth/session.spec.ts`, `security/session-handling.spec.ts` |
| L2-1.5 | `auth/login.spec.ts` (no enumeration), `auth/signup.spec.ts` (password policy) |
| L2-2.1 | `users/user-list.spec.ts`, `responsive/responsive-tables.spec.ts` |
| L2-2.2 | `users/add-edit-user.spec.ts` |
| L2-2.3 | `users/role-management.spec.ts` |
| L2-2.4 | `users/delete-user.spec.ts` |
| L2-2.5 | `integration/user-management-flow.spec.ts` |
| L2-3.1 | `loans/loan-list-creditor.spec.ts`, `responsive/responsive-tables.spec.ts` |
| L2-3.2 | `loans/loan-list-borrower.spec.ts` |
| L2-3.3 | `loans/create-loan.spec.ts`, `loans/edit-loan.spec.ts` |
| L2-3.4 | `loans/loan-detail.spec.ts` |
| L2-3.5 | `loans/edit-loan.spec.ts` |
| L2-4.1 | `payments/payment-schedule.spec.ts` |
| L2-4.2 | `payments/reschedule-payment.spec.ts` |
| L2-4.3 | `payments/pause-payment.spec.ts` |
| L2-4.4 | `payments/record-payment.spec.ts` |
| L2-4.5 | `payments/payment-history.spec.ts` |
| L2-4.6 | `payments/record-payment.spec.ts` (duplicate prevention) |
| L2-4.7 | `payments/reschedule-payment.spec.ts`, `integration/reschedule-pause-flow.spec.ts` |
| L2-5.1 | `dashboard/summary-cards.spec.ts`, `responsive/responsive-dashboard.spec.ts` |
| L2-5.2 | `dashboard/active-loans.spec.ts` |
| L2-5.3 | `dashboard/activity-feed.spec.ts` |
| L2-5.4 | `dashboard/dashboard-loading.spec.ts` |
| L2-6.1 | `notifications/notification-bell.spec.ts` |
| L2-6.2 | `notifications/toast-notifications.spec.ts` |
| L2-6.3 | `notifications/notification-list.spec.ts` |
| L2-6.4 | `integration/notification-flow.spec.ts` |
| L2-6.5 | `notifications/notification-preferences.spec.ts` |
| L2-7.1 | `responsive/navigation-desktop.spec.ts`, `responsive/navigation-tablet.spec.ts`, `responsive/navigation-mobile.spec.ts` |
| L2-7.2 | `responsive/responsive-forms.spec.ts` |
| L2-7.3 | `responsive/responsive-dialogs.spec.ts` |
| L2-7.4 | `accessibility/keyboard-navigation.spec.ts` |
| L2-7.5 | `accessibility/states.spec.ts` |
| L2-8.1 | `security/session-handling.spec.ts` |
| L2-10.1 | `security/route-protection.spec.ts` |
| L2-10.3 | `accessibility/states.spec.ts` (retry), `dashboard/dashboard-loading.spec.ts` |
| L2-11.4 | `.github/workflows/e2e-ci.yml` |

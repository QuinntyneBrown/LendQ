# LendQ Coding Conventions

Official coding standards for the LendQ codebase. All new code must follow these conventions. Existing code should be brought into compliance during regular development.

**Effective**: 2026-03-28

---

## Contents

- [General Principles](#general-principles)
- [Backend Conventions (Python / Flask)](#backend-conventions-python--flask)
  - [Project Structure](#project-structure)
  - [App Factory and Configuration](#app-factory-and-configuration)
  - [Models](#models)
  - [Repositories](#repositories)
  - [Services](#services)
  - [Controllers](#controllers)
  - [Schemas](#schemas)
  - [Error Handling](#error-handling)
  - [Middleware](#middleware)
  - [Background Tasks](#background-tasks)
  - [Testing](#testing)
  - [Code Style](#code-style)
- [Frontend Conventions (TypeScript / React)](#frontend-conventions-typescript--react)
  - [Project Structure](#frontend-project-structure)
  - [Components](#components)
  - [State Management](#state-management)
  - [API Client](#api-client)
  - [Forms and Validation](#forms-and-validation)
  - [Styling](#styling)
  - [Routing and Navigation](#routing-and-navigation)
  - [Error Handling (Frontend)](#error-handling-frontend)
  - [Testing (Frontend)](#testing-frontend)
  - [Code Style (Frontend)](#code-style-frontend)

---

## General Principles

1. **Readability over cleverness.** Code is read far more often than it is written. Prefer explicit, self-documenting code over terse abstractions.
2. **Consistency over preference.** Follow the established patterns in this document even if you personally prefer an alternative.
3. **Minimal scope.** Do not add features, abstractions, or configuration that the current task does not require.
4. **Secure by default.** Validate at system boundaries. Never trust user input. Never log secrets.
5. **Test what matters.** Cover business logic, edge cases, and authorization. Do not test framework behavior.

---

## Backend Conventions (Python / Flask)

### Project Structure

```
backend/
├── app/
│   ├── __init__.py          # App factory (create_app)
│   ├── config.py            # Config class hierarchy
│   ├── extensions.py        # Flask extension instances
│   ├── celery_app.py        # Celery factory
│   ├── models/              # SQLAlchemy models
│   │   ├── base.py          # UUIDMixin, TimestampMixin
│   │   ├── user.py
│   │   └── ...
│   ├── repositories/        # Data access layer
│   │   ├── base_repository.py
│   │   └── ...
│   ├── services/            # Business logic layer
│   ├── controllers/         # HTTP route handlers (Blueprints)
│   ├── schemas/             # Marshmallow request/response schemas
│   ├── middleware/           # Auth, CSRF, idempotency, request ID, headers
│   ├── errors/              # Exception hierarchy and handlers
│   ├── observability/       # Logging, metrics, health checks
│   ├── tasks/               # Celery task definitions
│   └── jobs/                # Scheduled job implementations
├── migrations/              # Alembic migration scripts
├── tests/
│   ├── conftest.py          # Fixtures and helpers
│   ├── factories.py         # Test data factories
│   ├── unit/
│   ├── integration/
│   └── security/
├── pyproject.toml
└── requirements.txt
```

**Rules:**

- Each layer depends only on the layer below it: controllers -> services -> repositories -> models.
- Controllers must not import models or call `db.session` directly.
- Services must not import `request`, `g`, or any Flask request-context objects.
- Repositories must not contain business logic.
- Models must not contain query logic or call `db.session`.

### App Factory and Configuration

**Factory pattern:**

```python
def create_app(config_name=None):
    load_dotenv()
    config_name = config_name or os.environ.get("FLASK_ENV", "development")

    app = Flask(__name__)
    app.url_map.strict_slashes = False
    app.config.from_object(config_by_name[config_name])
    app.config.from_prefixed_env("LENDQ")  # LENDQ_* env vars override config

    # Extensions, middleware, error handlers, blueprints, observability
    ...
    return app
```

**Configuration:**

- Use the class hierarchy: `Config` (base), `DevelopmentConfig`, `TestingConfig`, `ProductionConfig`.
- All secrets must come from environment variables, never hardcoded (except in `DevelopmentConfig` and `TestingConfig`).
- `ProductionConfig` must validate that required secrets are set.
- `app.config.from_prefixed_env("LENDQ")` must be called after `from_object()` to allow environment variable overrides in containerized deployments (e.g., `LENDQ_LOG_LEVEL=DEBUG`).

### Models

**Base mixins:**

All models must use the shared mixins defined in `app/models/base.py`:

```python
from app.models.base import UUIDMixin, TimestampMixin

class Loan(UUIDMixin, TimestampMixin, db.Model):
    __tablename__ = "loans"
    # Only domain-specific columns here
    description = db.Column(db.String(500), nullable=False)
    ...
```

**`UUIDMixin`** provides:
- `id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))`

**`TimestampMixin`** provides:
- `created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))`
- `updated_at = db.Column(db.DateTime, nullable=False, default=..., onupdate=...)`

Models that only need `created_at` (no `updated_at`) may use `UUIDMixin` alone and define `created_at` directly.

**Rules:**

- All primary keys are UUID strings (36 characters).
- All timestamps are UTC timezone-aware.
- Table names are explicit via `__tablename__` (plural, snake_case: `users`, `loans`, `payment_transactions`).
- Status values are defined as class constants on a dedicated class (e.g., `LoanStatus.ACTIVE`), not as bare strings.
- Monetary values use `db.Numeric(12, 2)`, never `Float`.
- Foreign keys reference the column explicitly: `db.ForeignKey("users.id")`.
- Relationships use `back_populates` for bidirectional access.
- Models must not contain query methods (`get_by_id`, `get_or_create`). Queries belong in repositories.
- Models must not call `db.session` directly.

### Repositories

**Base class:**

All repositories extend `BaseRepository`, which provides `get_by_id`, `get_all`, `get_paginated`, `create`, `update`, `delete`, `commit`, and `rollback`.

**Rules:**

- Repositories call `db.session.flush()`, never `db.session.commit()`. Services own the commit.
- Each repository maps to one model via `model = ModelClass`.
- Custom query methods belong on the repository subclass (e.g., `UserRepository.get_by_email()`).
- Paginated queries return a dict: `{"items": [...], "total": int, "page": int, "per_page": int, "pages": int}`.
- All public methods must have type hints on parameters and return types.
- All public methods must have a Google-style docstring.

**Example:**

```python
class UserRepository(BaseRepository):
    model = User

    def get_by_email(self, email: str) -> User | None:
        """Fetch a user by their email address.

        Args:
            email: The email address to look up.

        Returns:
            The matching User, or None if not found.
        """
        return User.query.filter_by(email=email).first()
```

### Services

Services contain all business logic. They coordinate between repositories, enforce domain rules, and own transaction boundaries.

**Rules:**

- Services instantiate their own repositories in `__init__`.
- `db.session.commit()` is called once at the end of a successful operation, inside the service method that initiated the transaction.
- All public methods must have type hints on parameters and return types.
- All public methods must have a Google-style docstring documenting parameters, return value, and raised exceptions.
- Raise domain exceptions (`NotFoundError`, `ConflictError`, `AuthorizationError`, etc.) for error cases. Never return error codes or None-as-error.
- Log significant actions at `INFO` level at the end of the method (e.g., `logger.info("Loan created: %s by %s", loan.id, user.id)`).

**Example:**

```python
class LoanService:
    def __init__(self) -> None:
        self.loan_repo = LoanRepository()
        self.schedule_service = ScheduleService()
        self.notification_service = NotificationService()
        self.audit_service = AuditService()

    def create_loan(self, data: dict, user: User) -> Loan:
        """Create a new loan with an initial payment schedule.

        Args:
            data: Validated loan creation payload (from CreateLoanRequestSchema).
            user: The authenticated user creating the loan (must have Creditor role).

        Returns:
            The newly created Loan instance.

        Raises:
            NotFoundError: If the specified borrower does not exist.
            AuthorizationError: If the user is not a Creditor.
        """
        ...
        db.session.commit()
        logger.info("Loan created: %s by %s", loan.id, user.id)
        return loan
```

### Controllers

Controllers are thin HTTP handlers. They parse the request, delegate to a service, and format the response.

**Rules:**

- One blueprint per controller file, with a URL prefix: `Blueprint("auth", __name__, url_prefix="/api/v1/auth")`.
- Schema instances are created at module level and reused.
- Decorator stacking order (top to bottom):
  1. `@blueprint.route()`
  2. `@require_auth` or `@require_role(...)`
  3. `@limiter.limit(...)`
  4. `@require_idempotency`
  5. `@require_csrf`
- Use `http.HTTPStatus` for all status codes. Never use bare integers.
- Response patterns:
  - `return jsonify(schema.dump(obj)), HTTPStatus.OK`
  - `return jsonify(schema.dump(obj)), HTTPStatus.CREATED`
  - `return "", HTTPStatus.NO_CONTENT`
  - `return jsonify({"message": "..."}), HTTPStatus.ACCEPTED`

**Example:**

```python
from http import HTTPStatus

@loan_bp.route("/", methods=["POST"])
@require_auth
def create_loan():
    data = create_loan_schema.load(request.get_json())
    loan_service = LoanService()
    loan = loan_service.create_loan(data, g.current_user)
    return jsonify(loan_schema.dump(loan)), HTTPStatus.CREATED
```

**Pagination responses** use the `paginated_response` helper:

```python
return jsonify(paginated_response(loan_schema, data)), HTTPStatus.OK
```

### Schemas

Marshmallow schemas handle all request validation (`.load()`) and response serialization (`.dump()`).

**Rules:**

- Request schemas are named `<Action><Entity>RequestSchema` (e.g., `CreateLoanRequestSchema`).
- Response schemas are named `<Entity>Schema` (e.g., `LoanSchema`).
- Output-only fields use `dump_only=True` (id, timestamps, computed fields).
- Monetary fields use `fields.Decimal(as_string=True)` to avoid floating-point rounding.
- Date fields use `fields.Date()`, datetime fields use `fields.DateTime()`.
- Nested relationships use `fields.Nested(OtherSchema, many=True, dump_only=True)`.
- Validation uses `validate=validate.Length(...)`, `validate.OneOf(...)`, `validate.Range(...)`, etc.
- Optional list fields use `load_default=[]`.

### Error Handling

**Exception hierarchy:**

```
AppError (500 / INTERNAL_ERROR)
├── AuthenticationError (401 / AUTHENTICATION_ERROR)
├── AuthorizationError  (403 / AUTHORIZATION_ERROR)
├── NotFoundError       (404 / NOT_FOUND)
├── ConflictError       (409 / CONFLICT)
└── ValidationError     (422 / VALIDATION_ERROR)
```

**Rules:**

- All exception classes use `http.HTTPStatus` for their `status_code` attribute.
- Error responses follow a standard envelope:
  ```json
  {
    "code": "NOT_FOUND",
    "message": "Loan not found",
    "request_id": "abc-123-def",
    "details": null
  }
  ```
- `details` is included only when present (e.g., field-level validation errors from Marshmallow).
- Never expose stack traces, internal paths, or SQL in error responses.
- Services raise domain exceptions. Controllers do not catch them — the global error handler converts them to JSON responses.

### Middleware

| Middleware | File | Purpose |
|---|---|---|
| Request ID | `request_id.py` | Generate/propagate `X-Request-ID` via `g.request_id` |
| Security headers | `security_headers.py` | HSTS, CSP, X-Frame-Options, etc. |
| Auth | `auth_middleware.py` | JWT validation, `g.current_user` / `g.token_payload` / `g.session_id` |
| Role enforcement | `auth_middleware.py` | `@require_role(...)` checks `user.has_any_role()` |
| CSRF | `csrf.py` | Validate `X-CSRF-Token` for session-cookie endpoints |
| Idempotency | `idempotency.py` | Cache and replay responses for `Idempotency-Key` header |
| Rate limiting | `rate_limiter.py` | Flask-Limiter with Redis backend |

**Rules:**

- All middleware decorators use `@functools.wraps(f)` to preserve the wrapped function's name.
- Authentication sets `g.current_user`, `g.token_payload`, and `g.session_id`. These are the only globals for user context.
- `@require_role(...)` must wrap `@require_auth` internally — callers should not stack both.

### Background Tasks

**Rules:**

- All Celery tasks are defined in `app/tasks/`.
- Tasks use `bind=True` for access to `self` (retry, request info).
- Tasks declare `max_retries` and `default_retry_delay`.
- Tasks must handle exceptions and call `self.retry(exc=exc)` for transient failures.
- Tasks must not import or use Flask request globals (`request`, `g`). They receive all needed data as arguments.
- Log task start, completion, and failure at appropriate levels.
- Task-level metrics (structured log events for start, success, failure, duration) should be emitted for production observability.

**Example:**

```python
@celery.task(bind=True, max_retries=3, default_retry_delay=60)
def send_notification_email(self, notification_id: str) -> None:
    """Send an email notification, retrying on transient failures."""
    ...
```

### Testing

**Structure:**

```
tests/
├── conftest.py           # App, db, client, auth fixtures
├── factories.py          # UserFactory, LoanFactory, PaymentFactory, etc.
├── unit/                 # Pure logic tests (services, helpers)
│   ├── services/
│   └── models/
├── integration/          # HTTP endpoint tests (client + db)
│   ├── test_auth_endpoints.py
│   └── ...
└── security/             # Authorization and header tests
```

**Rules:**

- Use **pytest** exclusively. No unittest.TestCase.
- Test files are named `test_<module>.py`.
- Fixtures live in `conftest.py`. Test data is created via factory classes in `factories.py`.
- Integration tests use the Flask test client with `auth_headers` fixture for authenticated requests.
- The `assert_error_response(resp, status, code)` helper validates error envelope structure.
- Each test cleans the database via the `clean_db` autouse fixture.
- Tests must not depend on execution order.

### Code Style

#### Naming

| Element | Convention | Example |
|---|---|---|
| Modules | `snake_case.py` | `loan_service.py` |
| Classes | `PascalCase` | `LoanService`, `PaymentSchema` |
| Functions / methods | `snake_case` | `create_loan()`, `get_by_email()` |
| Constants | `UPPER_SNAKE_CASE` | `LoanStatus.ACTIVE`, `SESSION_COOKIE_NAME` |
| Private | `_leading_underscore` | `_set_session_cookie()`, `_materialize_notification()` |
| Test functions | `test_<description>` | `test_create_loan_returns_201` |

#### Imports

Imports are ordered by the Ruff `I` (isort) rule:

1. Standard library (`os`, `datetime`, `logging`, `http`, `uuid`)
2. Third-party (`flask`, `sqlalchemy`, `marshmallow`, `celery`)
3. Local (`app.models`, `app.services`, `app.errors`)

One blank line between each group. Absolute imports only (`from app.models.user import User`), no relative imports.

#### Docstrings

All public methods in services and repositories must have **Google-style docstrings**:

```python
def record_payment(self, loan_id: str, data: dict, user: User) -> Payment:
    """Record a payment against a loan's scheduled installments.

    Allocates the payment amount to outstanding installments in due-date
    order. Updates the loan status to PAID_OFF if the balance reaches zero.

    Args:
        loan_id: The UUID of the loan to record payment against.
        data: Validated payment payload (amount, paid_date, notes).
        user: The authenticated user recording the payment.

    Returns:
        The created Payment record.

    Raises:
        NotFoundError: If the loan does not exist.
        AuthorizationError: If the user is not a participant of the loan.
        ValidationError: If no outstanding installments exist.
    """
```

Controllers do not require full docstrings — the route and method name should be self-descriptive.

#### Type Hints

All public method signatures in services and repositories must be typed:

```python
def get_by_email(self, email: str) -> User | None:
def create_loan(self, data: dict, user: User) -> Loan:
def get_paginated(self, page: int = 1, per_page: int = 20, ...) -> dict:
```

Use `X | None` (PEP 604 union syntax) instead of `Optional[X]`.

#### HTTP Status Codes

Use `http.HTTPStatus` from the standard library. Never use bare integers:

```python
from http import HTTPStatus

# Good
return jsonify(data), HTTPStatus.CREATED
return "", HTTPStatus.NO_CONTENT

# Bad
return jsonify(data), 201
return "", 204
```

#### Linting and Formatting

- **Linter**: Ruff with rules `E`, `F`, `I`, `N`, `W`, `UP`.
- **Formatter**: Ruff format (line length 100).
- Both are enforced in CI. Run `ruff check backend/` and `ruff format --check backend/` before committing.

#### Logging

- Create loggers at module level: `logger = logging.getLogger(__name__)`.
- Use `%s` placeholder style, not f-strings: `logger.info("Loan %s created by %s", loan_id, user_id)`.
- Never log secrets, passwords, tokens, or full request bodies.
- Log format is JSON in all environments (configured via `python-json-logger`).

---

## Frontend Conventions (TypeScript / React)

### Frontend Project Structure

```
frontend/src/
├── main.tsx                 # Entry point (StrictMode + createRoot)
├── App.tsx                  # Provider stack (QueryClient, Router, Auth, Toast)
├── routes.tsx               # Route definitions with lazy loading
├── index.css                # Tailwind directives and global styles
├── api/                     # HTTP client and shared types
│   ├── client.ts            # Axios instance, interceptors, apiGet/apiPost/etc.
│   └── types.ts             # Shared API response types
├── auth/                    # Authentication feature
│   ├── AuthContext.tsx       # AuthProvider (context + state)
│   ├── auth-context.ts      # AuthContextValue type + createContext
│   ├── useAuth.ts           # useAuth() hook
│   ├── ProtectedRoute.tsx   # Route guard component
│   ├── LoginPage.tsx        # Page component (default export)
│   └── ...
├── dashboard/               # Dashboard feature
│   ├── DashboardPage.tsx
│   ├── hooks.ts             # useDashboardSummary, useDashboardLoans, etc.
│   └── ...
├── loans/                   # Loan management feature
│   ├── LoanListPage.tsx
│   ├── LoanDetailPage.tsx
│   ├── hooks.ts             # useLoans, useLoanDetail, useCreateLoan, etc.
│   └── ...
├── payments/                # Payment feature components
├── users/                   # User management (Admin)
├── notifications/           # Notification feature + toast system
│   ├── hooks.ts
│   ├── ToastProvider.tsx
│   ├── ToastContainer.tsx
│   └── ...
├── settings/                # User settings/preferences
├── layout/                  # AppLayout, Sidebar, Header
├── ui/                      # Shared UI primitives
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Modal.tsx
│   ├── Badge.tsx
│   ├── Pagination.tsx
│   ├── EmptyState.tsx
│   ├── LoadingSkeleton.tsx
│   └── ...
└── utils/                   # Shared utilities and constants
    ├── constants.ts
    └── formatters.ts
```

**Rules:**

- Features are organized by domain (`auth/`, `loans/`, `payments/`, `notifications/`), not by technical type.
- Each feature directory contains its pages, hooks, and sub-components.
- Shared UI primitives live in `ui/`. These are generic, reusable, and unaware of business logic.
- API types and the HTTP client live in `api/`. Feature-specific hooks import from `api/client.ts`.
- No barrel files (`index.ts` re-exporting everything). Import directly from the source file.

### Components

**Rules:**

- All components are **functional components** using hooks. No class components.
- Page components use `default export` (required for `React.lazy()`).
- Non-page components use **named exports**: `export function Button(...)`.
- Props are typed with **TypeScript interfaces** defined in the same file (or `api/types.ts` for shared types).
- Prop interfaces are named `<Component>Props` (e.g., `ButtonProps`, `LoanTableProps`).
- Components that need to forward refs use `forwardRef` (e.g., `Input`, `Select`).

**Component structure:**

```typescript
// 1. Imports
import { useState } from "react";
import type { LucideIcon } from "lucide-react";

// 2. Types/interfaces
interface CardProps {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
}

// 3. Constants (variant maps, config)
const sizeClasses: Record<string, string> = { ... };

// 4. Component
export function Card({ title, icon: Icon, children }: CardProps) {
  return ( ... );
}

// 5. Default export (pages only)
export default Card;
```

**Naming:**

| Element | Convention | Example |
|---|---|---|
| Component files | `PascalCase.tsx` | `LoanDetailPage.tsx` |
| Hook files | `camelCase.ts` or `hooks.ts` | `useAuth.ts`, `hooks.ts` |
| Utility files | `camelCase.ts` | `formatters.ts` |
| Type files | `camelCase.ts` | `types.ts` |
| Components | `PascalCase` | `LoanTable`, `SummaryCards` |
| Hooks | `use` prefix | `useAuth`, `useLoans`, `useDashboardSummary` |
| Event handlers | `handle` prefix | `handleSubmit`, `handleTabChange` |
| Boolean props | `is` / `has` prefix | `isLoading`, `isOpen`, `hasError` |

### State Management

**Hierarchy (prefer top to bottom):**

1. **URL state** (`useSearchParams`) — for filters, tabs, pagination that should survive navigation.
2. **Server state** (TanStack Query) — for all data fetched from the API.
3. **Local component state** (`useState`) — for UI-only state (modals, form inputs).
4. **Context** (`useContext`) — only for truly global state (auth, toast). Do not overuse.

**TanStack Query rules:**

- Every API call goes through a custom hook in the feature's `hooks.ts` file.
- `queryKey` must be a structured array that includes all parameters affecting the query:
  ```typescript
  queryKey: ["loans", { view, page, search, status }]
  ```
- Mutations use `onSuccess` to invalidate affected queries:
  ```typescript
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["loans"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }
  ```
- Use `staleTime` to prevent unnecessary refetches (default: 30 seconds for most data).
- Use `enabled: !!id` for queries that depend on a parameter being present.
- Use `refetchInterval` only for polling (e.g., notification count).

**Auth context:**

- `AuthProvider` in `App.tsx` manages login, logout, signup, token refresh, and user state.
- Access via `useAuth()` hook. Never access `AuthContext` directly.
- Tokens are stored in `localStorage`. The Axios interceptor handles automatic refresh on 401.

### API Client

**Rules:**

- All HTTP calls go through `apiGet`, `apiPost`, `apiPut`, `apiDelete` from `api/client.ts`.
- These functions are typed with generics: `apiGet<Loan>("/loans/123")`.
- The Axios instance handles:
  - Automatic `Authorization: Bearer` header injection.
  - Automatic token refresh on 401 (with request queuing).
  - Base URL: `/api/v1`.
- API response types are defined in `api/types.ts` and shared across all features.
- Paginated responses use `PaginatedResponse<T>`:
  ```typescript
  interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    per_page: number;
    pages: number;
  }
  ```

### Forms and Validation

**Stack:** React Hook Form + Zod.

**Rules:**

- Define a Zod schema for every form. The schema is the source of truth for validation.
- Use `@hookform/resolvers/zod` to connect Zod to React Hook Form.
- Form inputs use `forwardRef` and are registered via `{...register("fieldName")}`.
- Error messages are displayed inline below each field.
- Submit buttons show a loading state during submission (`isLoading` / `isSubmitting`).

**Example pattern:**

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Must be at least 8 characters"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => { ... };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input label="Email" {...register("email")} error={errors.email?.message} />
      <Input label="Password" type="password" {...register("password")} error={errors.password?.message} />
      <Button type="submit" isLoading={isSubmitting}>Log in</Button>
    </form>
  );
}
```

### Styling

**Stack:** Tailwind CSS with custom design tokens.

**Rules:**

- All styling uses **Tailwind utility classes**. No external CSS files except `index.css` (Tailwind directives and font imports).
- Custom design tokens are defined in `tailwind.config.js`: colors (`primary`, `surface`, `text-primary`, etc.), fonts (`heading`, `body`), border radii (`button`, `card`, `modal`), and shadows.
- Use semantic token names in classes: `text-text-primary`, `bg-background`, `border-border-strong`, `rounded-card`.
- Variant/size classes are defined as `Record` maps for components with multiple visual states:
  ```typescript
  const variantClasses: Record<ButtonProps["variant"], string> = {
    primary: "bg-primary text-white hover:bg-primary-hover",
    secondary: "bg-background text-text-primary border border-border-strong",
  };
  ```
- Responsive design uses Tailwind breakpoints: `sm:`, `md:`, `lg:`. Mobile-first.
- For complex responsive behavior, use the `useBreakpoint()` hook to conditionally render different component trees (e.g., table on desktop, card list on mobile).

### Routing and Navigation

**Rules:**

- All routes are defined in `src/routes.tsx`.
- Page components are lazy-loaded: `const DashboardPage = lazy(() => import("@/dashboard/DashboardPage"))`.
- Protected routes use `<ProtectedRoute>` which checks `isAuthenticated` and optionally `requiredRoles`.
- The authenticated layout (`<AppLayout>`) wraps all protected routes via a layout route with `<Outlet />`.
- Navigation uses `useNavigate()` for programmatic navigation and `<Link>` / `<NavLink>` for declarative links.
- Filter state (tabs, search, status) is persisted in URL search params via `useSearchParams`.

### Error Handling (Frontend)

**Rules:**

- API errors from the backend follow the `{ code, message, request_id, details }` envelope.
- The `ApiError` type in `api/types.ts` models this structure.
- Mutations surface errors via the toast system: `toast.error(error.response?.data?.message || "Something went wrong")`.
- Query errors are handled per-component with `isError` / `error` from the query hook, rendering an inline error state with a retry button.
- Network errors (no response) show a generic connectivity message.
- 401 errors are handled globally by the Axios interceptor (token refresh or redirect to login).

### Testing (Frontend)

**Stack:** Playwright for E2E tests (in `e2e/`). Vite build (`tsc -b && vite build`) serves as a type-check gate.

**Rules:**

- All pages and critical user flows must have Playwright coverage in `e2e/`.
- Tests are organized by feature: `e2e/tests/auth/`, `e2e/tests/loans/`, etc.
- Page objects live in `e2e/pages/` and abstract selectors away from test logic.
- Tests must use `data-testid` attributes for element selection, not CSS classes or text content.
- Accessibility: key flows are tested for keyboard navigation and screen reader compatibility.

### Code Style (Frontend)

**TypeScript:**

- Strict mode enabled (`"strict": true` in `tsconfig.app.json`).
- Use `interface` for object shapes and component props. Use `type` for unions, intersections, and utility types.
- Prefer `X | null` over `X | undefined` for explicitly absent values.
- Use `as const` for literal arrays and objects used as type sources.

**Formatting and linting:**

- **ESLint** with `typescript-eslint`, `react-hooks`, and `react-refresh` plugins.
- Formatting is enforced by the project's ESLint + Prettier configuration.
- Import paths use the `@/` alias (mapped to `src/`): `import { useAuth } from "@/auth/useAuth"`.

**General:**

- Prefer named functions (`function Foo()`) over arrow functions for components.
- Use `type` imports where possible: `import type { User } from "@/api/types"`.
- Destructure props in the function signature.
- Avoid inline object/array literals in JSX props that cause unnecessary re-renders. Extract to constants or `useMemo`.

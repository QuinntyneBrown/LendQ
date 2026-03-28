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
- [Frontend Conventions (C# / Blazor WebAssembly)](#frontend-conventions-c--blazor-webassembly)
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

## Frontend Conventions (C# / Blazor WebAssembly)

### Frontend Project Structure

```
frontend/
├── Program.cs                   # Entry point (WebAssemblyHostBuilder, DI registration)
├── App.razor                    # Root component (Router, CascadingAuthenticationState)
├── _Imports.razor               # Global @using directives
├── wwwroot/
│   ├── index.html               # Host HTML page
│   ├── css/                     # Tailwind output and global styles
│   └── appsettings.json         # Client-side configuration
├── Pages/                       # Routable page components (@page directive)
│   ├── Login.razor
│   ├── Dashboard.razor
│   ├── LoanList.razor
│   ├── LoanDetail.razor
│   └── ...
├── Components/                  # Reusable non-page components
│   ├── Button.razor
│   ├── InputField.razor
│   ├── Modal.razor
│   ├── Badge.razor
│   ├── Pagination.razor
│   ├── EmptyState.razor
│   ├── LoadingSkeleton.razor
│   └── ...
├── Services/                    # Injectable HttpClient wrappers and business logic
│   ├── ILoanService.cs
│   ├── LoanService.cs
│   ├── IAuthService.cs
│   ├── AuthService.cs
│   └── ...
├── Models/                      # DTOs and form model classes
│   ├── LoanDto.cs
│   ├── CreateLoanRequest.cs
│   ├── PaginatedResponse.cs
│   └── ...
├── Layout/                      # Layout components
│   ├── MainLayout.razor
│   ├── Sidebar.razor
│   ├── Header.razor
│   └── NavMenu.razor
├── Auth/                        # Authentication components and handlers
│   ├── CustomAuthStateProvider.cs
│   ├── AuthorizationMessageHandler.cs
│   └── RedirectToLogin.razor
└── Shared/                      # Shared utilities, constants, and extensions
    ├── Constants.cs
    └── Formatters.cs
```

**Rules:**

- Pages live in `Pages/` and contain an `@page` directive. Reusable components live in `Components/`.
- Services are defined as interface + implementation pairs (`ILoanService` / `LoanService`) and registered in `Program.cs`.
- DTOs and form models live in `Models/`. These are plain C# classes with data annotation attributes.
- Layout components (`MainLayout`, `Sidebar`, `Header`) live in `Layout/`.
- Authentication infrastructure (custom `AuthenticationStateProvider`, message handlers) lives in `Auth/`.
- No "god" files. Each component, service, and model gets its own file.

### Components

**Rules:**

- All UI is built with **Razor components** (`.razor` files). No raw JavaScript UI.
- Page components include an `@page "/path"` directive at the top of the file.
- Component parameters are declared as public properties with the `[Parameter]` attribute:
  ```razor
  @code {
      [Parameter] public string Title { get; set; } = "";
      [Parameter] public RenderFragment? ChildContent { get; set; }
  }
  ```
- Use `[CascadingParameter]` to receive authentication state:
  ```razor
  @code {
      [CascadingParameter] private Task<AuthenticationState> AuthState { get; set; } = default!;
  }
  ```
- Child-to-parent communication uses `EventCallback<T>`:
  ```razor
  @code {
      [Parameter] public EventCallback<string> OnSearch { get; set; }

      private async Task HandleInput(ChangeEventArgs e)
      {
          await OnSearch.InvokeAsync(e.Value?.ToString());
      }
  }
  ```
- Component lifecycle methods are used in this order: `OnInitializedAsync` for initial data loading, `OnParametersSetAsync` for reacting to parameter changes.
- Components that hold disposable resources (timers, event subscriptions) must implement `IDisposable` via `@implements IDisposable`.
- One component per `.razor` file. File name matches the component name (`LoanTable.razor` contains the `LoanTable` component).

**Component structure:**

```razor
@* 1. Directives *@
@page "/loans"
@using LendQ.Models
@inject ILoanService LoanService
@inject NavigationManager Navigation

@* 2. Markup *@
<PageTitle>Loans</PageTitle>

<div class="p-6">
    @if (_loans is null)
    {
        <LoadingSkeleton />
    }
    else
    {
        <LoanTable Loans="_loans" OnRowClick="HandleRowClick" />
    }
</div>

@* 3. Code block *@
@code {
    private List<LoanDto>? _loans;

    protected override async Task OnInitializedAsync()
    {
        _loans = await LoanService.GetLoansAsync();
    }

    private void HandleRowClick(string loanId)
    {
        Navigation.NavigateTo($"/loans/{loanId}");
    }
}
```

**Naming:**

| Element | Convention | Example |
|---|---|---|
| Component files | `PascalCase.razor` | `LoanDetailPage.razor` |
| Service files | `PascalCase.cs` | `LoanService.cs` |
| Model files | `PascalCase.cs` | `LoanDto.cs` |
| Components | `PascalCase` | `LoanTable`, `SummaryCards` |
| Public members | `PascalCase` | `Title`, `OnSearch`, `GetLoansAsync()` |
| Private fields | `_camelCase` | `_loans`, `_isLoading` |
| Event callbacks | `On` prefix | `OnSearch`, `OnRowClick`, `OnSubmit` |
| Boolean parameters | `Is` / `Has` prefix | `IsLoading`, `IsOpen`, `HasError` |

### State Management

**Hierarchy (prefer top to bottom):**

1. **URL state** (`NavigationManager`, query strings) — for filters, tabs, pagination that should survive navigation.
2. **Server state** (injectable `HttpClient` services with caching) — for all data fetched from the API. Services may cache responses in memory where appropriate.
3. **Component state** (`@code` block fields, `StateHasChanged()`) — for UI-only state (modals, form inputs, loading flags).
4. **App-wide state** (scoped/singleton DI services with events) — only for truly global state (auth, toast, notification count). Do not overuse.

**Service-based data access rules:**

- Every API call goes through an injectable service registered in `Program.cs`.
- Services expose async methods that return typed DTOs:
  ```csharp
  public interface ILoanService
  {
      Task<List<LoanDto>> GetLoansAsync(LoanFilter? filter = null);
      Task<LoanDto> GetLoanByIdAsync(string id);
      Task<LoanDto> CreateLoanAsync(CreateLoanRequest request);
  }
  ```
- Services that need to notify components of state changes expose events:
  ```csharp
  public event Action? OnChange;
  ```
  Components subscribe in `OnInitializedAsync` and unsubscribe in `Dispose`.

**Auth state:**

- `CustomAuthStateProvider` extends `AuthenticationStateProvider` and manages login, logout, and token state.
- Access auth state via `[CascadingParameter] Task<AuthenticationState>` or `@inject AuthenticationStateProvider`.
- Tokens are stored in `localStorage` via JS interop. The `AuthorizationMessageHandler` handles automatic Bearer injection.

### API Client

**Rules:**

- A typed `HttpClient` is registered in `Program.cs` using `builder.Services.AddHttpClient<ILoanService, LoanService>(...)`.
- `AuthorizationMessageHandler` is registered as a `DelegatingHandler` to inject `Authorization: Bearer` headers automatically:
  ```csharp
  builder.Services.AddTransient<AuthorizationMessageHandler>();

  builder.Services.AddHttpClient<ILoanService, LoanService>(client =>
  {
      client.BaseAddress = new Uri("http://localhost:5000/api/v1/");
  })
  .AddHttpMessageHandler<AuthorizationMessageHandler>();
  ```
- A custom `RequestIdHandler` (also a `DelegatingHandler`) adds an `X-Request-Id` header to every outbound request.
- Services use the generic JSON methods from `System.Net.Http.Json`:
  ```csharp
  var loans = await _httpClient.GetFromJsonAsync<List<LoanDto>>("loans");
  var response = await _httpClient.PostAsJsonAsync("loans", request);
  ```
- API response types are defined in `Models/` and shared across all services.
- Paginated responses use `PaginatedResponse<T>`:
  ```csharp
  public class PaginatedResponse<T>
  {
      public List<T> Items { get; set; } = new();
      public int Total { get; set; }
      public int Page { get; set; }
      public int PerPage { get; set; }
      public int Pages { get; set; }
  }
  ```

### Forms and Validation

**Stack:** EditForm + DataAnnotationsValidator for standard rules, FluentValidation for complex rules.

**Rules:**

- Every form uses `<EditForm>` with a model class and `<DataAnnotationsValidator />`:
  ```razor
  <EditForm Model="_formModel" OnValidSubmit="HandleSubmit">
      <DataAnnotationsValidator />
      ...
  </EditForm>
  ```
- Form model classes define validation via data annotations:
  ```csharp
  public class LoginFormModel
  {
      [Required(ErrorMessage = "Email is required")]
      [EmailAddress(ErrorMessage = "Invalid email")]
      public string Email { get; set; } = "";

      [Required(ErrorMessage = "Password is required")]
      [StringLength(128, MinimumLength = 8, ErrorMessage = "Must be at least 8 characters")]
      public string Password { get; set; } = "";
  }
  ```
- For complex cross-field or async validation, use **FluentValidation** with the `FluentValidationValidator` component.
- Use the built-in input components: `InputText`, `InputNumber`, `InputDate`, `InputSelect`, `InputCheckbox`.
- Display per-field errors with `<ValidationMessage For="@(() => _formModel.Email)" />`.
- Submit buttons show a loading state during submission using a `_isSubmitting` flag.

**Example pattern:**

```razor
@page "/login"
@inject IAuthService AuthService

<EditForm Model="_formModel" OnValidSubmit="HandleSubmit">
    <DataAnnotationsValidator />

    <div class="mb-4">
        <label class="text-text-primary">Email</label>
        <InputText @bind-Value="_formModel.Email" class="input" />
        <ValidationMessage For="@(() => _formModel.Email)" />
    </div>

    <div class="mb-4">
        <label class="text-text-primary">Password</label>
        <InputText @bind-Value="_formModel.Password" type="password" class="input" />
        <ValidationMessage For="@(() => _formModel.Password)" />
    </div>

    <Button Type="submit" IsLoading="_isSubmitting">Log in</Button>
</EditForm>

@code {
    private LoginFormModel _formModel = new();
    private bool _isSubmitting;

    private async Task HandleSubmit()
    {
        _isSubmitting = true;
        await AuthService.LoginAsync(_formModel.Email, _formModel.Password);
        _isSubmitting = false;
    }
}
```

### Styling

**Stack:** Tailwind CSS with custom design tokens, plus CSS isolation for component-specific styles.

**Rules:**

- All styling uses **Tailwind utility classes**. Global styles and Tailwind directives live in `wwwroot/css/`.
- Custom design tokens are defined in `tailwind.config.js`: colors (`primary`, `surface`, `text-primary`, etc.), fonts (`heading`, `body`), border radii (`button`, `card`, `modal`), and shadows.
- Use semantic token names in classes: `text-text-primary`, `bg-background`, `border-border-strong`, `rounded-card`.
- Component-specific styles use **CSS isolation** (`.razor.css` files). A file named `LoanTable.razor.css` is automatically scoped to `LoanTable.razor`:
  ```css
  /* LoanTable.razor.css */
  .loan-row:hover {
      @apply bg-surface;
  }
  ```
- Responsive design uses Tailwind breakpoints: `sm:`, `md:`, `lg:`. Mobile-first.
- For complex responsive behavior, use a `BreakpointService` (backed by JS interop and `window.matchMedia`) to conditionally render different component trees (e.g., table on desktop, card list on mobile).

### Routing and Navigation

**Rules:**

- Page components declare their route with `@page "/path"` at the top of the file. Multiple `@page` directives are allowed for route aliases.
- The root `App.razor` uses `<CascadingAuthenticationState>` and `<AuthorizeRouteView>` to enforce auth on protected routes:
  ```razor
  <CascadingAuthenticationState>
      <Router AppAssembly="@typeof(App).Assembly">
          <Found Context="routeData">
              <AuthorizeRouteView RouteData="@routeData" DefaultLayout="@typeof(MainLayout)">
                  <NotAuthorized>
                      <RedirectToLogin />
                  </NotAuthorized>
              </AuthorizeRouteView>
          </Found>
          <NotFound>
              <LayoutView Layout="@typeof(MainLayout)">
                  <p>Page not found.</p>
              </LayoutView>
          </NotFound>
      </Router>
  </CascadingAuthenticationState>
  ```
- Role-based access uses `[Authorize]` and `[Authorize(Roles = "Admin")]` attributes on page components:
  ```razor
  @page "/admin/users"
  @attribute [Authorize(Roles = "Admin")]
  ```
- Programmatic navigation uses `NavigationManager.NavigateTo("/path")`.
- Query string parameters are captured using `[SupplyParameterFromQuery]` or parsed manually from `NavigationManager.Uri`.

### Error Handling (Frontend)

**Rules:**

- All service calls are wrapped in try-catch blocks. Services throw typed exceptions or return result objects for expected error cases.
- User-facing errors are displayed via `IToastService` (injected into components):
  ```csharp
  try
  {
      await LoanService.CreateLoanAsync(request);
      ToastService.ShowSuccess("Loan created successfully.");
  }
  catch (HttpRequestException ex)
  {
      ToastService.ShowError(ex.Message ?? "Something went wrong.");
  }
  ```
- Unhandled exceptions in the component tree are caught by `<ErrorBoundary>`:
  ```razor
  <ErrorBoundary @ref="_errorBoundary">
      <ChildContent>
          @Body
      </ChildContent>
      <ErrorContent>
          <p class="text-red-600">An unexpected error occurred. <button @onclick="Recover">Retry</button></p>
      </ErrorContent>
  </ErrorBoundary>
  ```
- API errors from the backend follow the `{ code, message, request_id, details }` envelope. Services parse this into a typed `ApiError` model.
- 401 responses are handled by the `AuthorizationMessageHandler`, which triggers a token refresh or redirects to login.

### Testing (Frontend)

**Stack:** bUnit for component unit tests, Playwright for E2E tests (in `e2e/`). `dotnet build` serves as the compilation gate.

**Rules:**

- Component unit tests use **bUnit** and live in a separate test project (`frontend.Tests/`).
- bUnit tests verify rendering, parameter binding, event callbacks, and service interactions via mocked dependencies:
  ```csharp
  [Fact]
  public void LoanTable_RendersAllRows()
  {
      var loans = new List<LoanDto> { new() { Id = "1", Description = "Test" } };
      var cut = RenderComponent<LoanTable>(p => p.Add(x => x.Loans, loans));
      cut.FindAll("tr").Count.Should().Be(2); // header + 1 data row
  }
  ```
- All pages and critical user flows must have Playwright coverage in `e2e/`.
- Tests are organized by feature: `e2e/tests/auth/`, `e2e/tests/loans/`, etc.
- Page objects live in `e2e/pages/` and abstract selectors away from test logic.
- Tests must use `data-testid` attributes for element selection, not CSS classes or text content.
- Accessibility: key flows are tested for keyboard navigation and screen reader compatibility.

### Code Style (Frontend)

**C# conventions:**

- **PascalCase** for all public members: properties, methods, parameters, events, components (`Title`, `GetLoansAsync`, `OnSearch`).
- **_camelCase** for private fields: `_loans`, `_isLoading`, `_httpClient`.
- Interfaces are prefixed with `I`: `ILoanService`, `IAuthService`, `IToastService`.
- One component per `.razor` file. The file name matches the component name.
- Use `@inject` for dependency injection in Razor components:
  ```razor
  @inject ILoanService LoanService
  @inject NavigationManager Navigation
  @inject IToastService ToastService
  ```
- Use `@implements IDisposable` when the component subscribes to events or holds unmanaged resources:
  ```razor
  @implements IDisposable

  @code {
      protected override void OnInitialized()
      {
          NotificationService.OnChange += StateHasChanged;
      }

      public void Dispose()
      {
          NotificationService.OnChange -= StateHasChanged;
      }
  }
  ```

**File organization:**

- Service interfaces and implementations are in separate files (`ILoanService.cs`, `LoanService.cs`).
- Model/DTO classes are one-per-file in `Models/`.
- Use file-scoped namespaces (`namespace LendQ.Models;`) instead of block-scoped.

**Formatting and analysis:**

- **Analyzer**: `dotnet format` with the project's `.editorconfig` settings.
- **Nullable reference types** are enabled (`<Nullable>enable</Nullable>` in the `.csproj`).
- Prefer `var` for local variables when the type is obvious from the right-hand side.
- Use `async`/`await` consistently. Never use `.Result` or `.Wait()` — these deadlock in Blazor WASM.

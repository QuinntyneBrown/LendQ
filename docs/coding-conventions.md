# LendQ Coding Conventions

Official coding standards for the LendQ codebase. All new code must follow these conventions. Existing code should be brought into compliance during regular development.

**Effective**: 2026-03-28

---

## Contents

- [General Principles](#general-principles)
- [Backend Conventions (C# / ASP.NET Core)](#backend-conventions-c--aspnet-core)
  - [Project Structure](#project-structure)
  - [Architecture](#architecture)
  - [Program.cs and Configuration](#programcs-and-configuration)
  - [Entities](#entities)
  - [Repositories](#repositories)
  - [Services](#services)
  - [Controllers](#controllers)
  - [DTOs and Validation](#dtos-and-validation)
  - [Error Handling](#error-handling)
  - [Middleware and Filters](#middleware-and-filters)
  - [Background Jobs](#background-jobs)
  - [Testing](#testing)
  - [Code Style](#code-style)
- [Frontend Conventions (TypeScript / Angular)](#frontend-conventions-typescript--angular)
  - [Project Structure](#frontend-project-structure)
  - [Components](#components)
  - [State Management](#state-management)
  - [HTTP Client and API Integration](#http-client-and-api-integration)
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

## Backend Conventions (C# / ASP.NET Core)

### Project Structure

```
backend/
├── LendQ.Api/                    # ASP.NET Core Web API project
│   ├── Program.cs                # Host builder, DI, middleware pipeline
│   ├── Controllers/              # API controllers
│   ├── Filters/                  # Action filters (validation, exception handling)
│   ├── Middleware/                # Custom middleware (request ID, security headers)
│   └── appsettings.json
├── LendQ.Core/                   # Domain models and interfaces (no dependencies)
│   ├── Entities/
│   ├── Interfaces/
│   ├── Enums/
│   └── Exceptions/
├── LendQ.Application/            # Business logic (services, DTOs, validators)
│   ├── Services/
│   ├── DTOs/
│   ├── Validators/
│   └── Mapping/
├── LendQ.Infrastructure/         # Data access, external integrations
│   ├── Data/
│   │   ├── AppDbContext.cs
│   │   ├── Configurations/       # EF Core entity configurations
│   │   ├── Repositories/
│   │   └── Migrations/
│   ├── Identity/
│   ├── BackgroundJobs/
│   └── Email/
├── LendQ.Tests/
│   ├── Unit/
│   ├── Integration/
│   └── Security/
└── LendQ.sln
```

**Rules:**

- The solution follows Clean Architecture: API depends on Application, Application depends on Core, Infrastructure depends on Core and implements its interfaces.
- Controllers must not reference `AppDbContext`, entity classes, or infrastructure concerns directly.
- Services must not reference `HttpContext`, `HttpRequest`, or any ASP.NET request-context objects.
- Repositories must not contain business logic.
- Entities must not contain query logic, navigation property access patterns, or direct `DbContext` usage.

### Architecture

The solution uses **Clean Architecture** with the following dependency flow:

```
LendQ.Api  -->  LendQ.Application  -->  LendQ.Core
                                            ^
LendQ.Infrastructure  ----------------------|
```

- **LendQ.Core** is the innermost layer. It has zero project references and no NuGet dependencies beyond base class library types. It defines entities, domain interfaces (e.g., `ILoanRepository`, `IEmailService`), enums, and domain exception types.
- **LendQ.Application** contains business logic, DTOs, FluentValidation validators, and AutoMapper profiles. It depends only on Core.
- **LendQ.Infrastructure** implements the interfaces defined in Core. It owns `AppDbContext`, repository implementations, EF Core configurations, identity integration, background job implementations, and external service clients. It depends on Core.
- **LendQ.Api** is the composition root. It wires up dependency injection, configures the middleware pipeline, and hosts controllers. It depends on Application and Infrastructure (for DI registration only).

### Program.cs and Configuration

**Composition root:**

```csharp
var builder = WebApplication.CreateBuilder(args);

// Service registration
builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        opts.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

builder.Services.AddApplicationServices();      // Extension method in LendQ.Application
builder.Services.AddInfrastructureServices(      // Extension method in LendQ.Infrastructure
    builder.Configuration);

builder.Host.UseSerilog((context, config) =>
    config.ReadFrom.Configuration(context.Configuration));

var app = builder.Build();

// Middleware pipeline
app.UseMiddleware<RequestIdMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseSerilogRequestLogging();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

**Configuration:**

- Use the `appsettings.json` / `appsettings.{Environment}.json` / environment variable layering provided by the default ASP.NET Core configuration system.
- All secrets must come from environment variables or a secrets manager, never hardcoded (except in `appsettings.Development.json`).
- Bind configuration sections to strongly typed options classes using `builder.Services.Configure<T>()` and the Options pattern.
- Environment variables override appsettings values. Use the `__` (double underscore) separator for nested keys (e.g., `ConnectionStrings__DefaultConnection`).

### Entities

**Base entity:**

All entities must inherit from the shared `BaseEntity` class defined in `LendQ.Core/Entities/`:

```csharp
public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

**Example entity:**

```csharp
public class Loan : BaseEntity
{
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public LoanStatus Status { get; set; } = LoanStatus.Active;

    public Guid BorrowerId { get; set; }
    public User Borrower { get; set; } = null!;

    public Guid CreditorId { get; set; }
    public User Creditor { get; set; } = null!;

    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
```

**EF Core configuration:**

Entity configurations are defined in separate `IEntityTypeConfiguration<T>` classes under `LendQ.Infrastructure/Data/Configurations/`:

```csharp
public class LoanConfiguration : IEntityTypeConfiguration<Loan>
{
    public void Configure(EntityTypeBuilder<Loan> builder)
    {
        builder.ToTable("loans");
        builder.HasKey(l => l.Id);
        builder.Property(l => l.Description).HasMaxLength(500).IsRequired();
        builder.Property(l => l.Amount).HasColumnType("decimal(12,2)");
        builder.HasOne(l => l.Borrower)
            .WithMany()
            .HasForeignKey(l => l.BorrowerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
```

**Rules:**

- All primary keys are `Guid`.
- All timestamps are UTC.
- Table names are explicit via `ToTable()` (plural, snake_case: `users`, `loans`, `payment_transactions`).
- Status values are defined as enums in `LendQ.Core/Enums/` (e.g., `LoanStatus.Active`), not as bare strings.
- Monetary values use `decimal` with `HasColumnType("decimal(12,2)")`, never `float` or `double`.
- Foreign keys are explicit properties on the entity (e.g., `BorrowerId`).
- Navigation properties use `null!` as the default value to satisfy nullability checks while relying on EF Core to populate them.
- Entities are POCO classes. All EF Core configuration (column types, constraints, indexes, relationships) belongs in the `IEntityTypeConfiguration<T>` class, not in data annotations on the entity.

### Repositories

Repositories are optional. EF Core's `DbContext` can be used directly in services, or the repository pattern can be applied for testability and abstraction.

**When using the repository pattern:**

- Define repository interfaces in `LendQ.Core/Interfaces/` (e.g., `ILoanRepository`).
- Implement repository classes in `LendQ.Infrastructure/Data/Repositories/`.
- A generic `IRepository<T>` base interface provides `GetByIdAsync`, `GetAllAsync`, `AddAsync`, `UpdateAsync`, `DeleteAsync`, and `SaveChangesAsync`.
- Custom query methods belong on the specific repository interface (e.g., `IUserRepository.GetByEmailAsync()`).
- Repositories call `SaveChangesAsync()` only when the service explicitly requests it. Services own the transaction boundary.

**Example:**

```csharp
public interface IUserRepository : IRepository<User>
{
    /// <summary>
    /// Fetches a user by their email address.
    /// </summary>
    /// <param name="email">The email address to look up.</param>
    /// <returns>The matching user, or null if not found.</returns>
    Task<User?> GetByEmailAsync(string email);
}

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(AppDbContext context) : base(context) { }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email);
    }
}
```

**Paginated queries** return a `PagedResult<T>`:

```csharp
public class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; set; } = Array.Empty<T>();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}
```

### Services

Services contain all business logic. They coordinate between repositories (or `DbContext`), enforce domain rules, and own transaction boundaries.

**Rules:**

- Services are registered in the DI container with a scoped lifetime.
- Dependencies are injected via constructor injection. Services must not instantiate their own dependencies.
- All public methods are `async` and return `Task<T>` or `Task`. Use the `Async` suffix in method names.
- Raise domain exceptions (`NotFoundException`, `ConflictException`, `AuthorizationException`, etc.) for error cases. Never return error codes or null-as-error.
- Log significant actions at `Information` level at the end of the method using Serilog structured logging.
- All public methods must have XML documentation comments documenting parameters, return value, and thrown exceptions.

**Example:**

```csharp
public class LoanService : ILoanService
{
    private readonly ILoanRepository _loanRepository;
    private readonly IScheduleService _scheduleService;
    private readonly ILogger<LoanService> _logger;

    public LoanService(
        ILoanRepository loanRepository,
        IScheduleService scheduleService,
        ILogger<LoanService> logger)
    {
        _loanRepository = loanRepository;
        _scheduleService = scheduleService;
        _logger = logger;
    }

    /// <summary>
    /// Creates a new loan with an initial payment schedule.
    /// </summary>
    /// <param name="request">Validated loan creation request.</param>
    /// <param name="userId">The authenticated user creating the loan.</param>
    /// <returns>The newly created loan.</returns>
    /// <exception cref="NotFoundException">If the specified borrower does not exist.</exception>
    /// <exception cref="AuthorizationException">If the user is not a Creditor.</exception>
    public async Task<Loan> CreateLoanAsync(CreateLoanRequest request, Guid userId)
    {
        // Business logic...
        await _loanRepository.AddAsync(loan);
        await _loanRepository.SaveChangesAsync();

        _logger.LogInformation("Loan {LoanId} created by {UserId}", loan.Id, userId);
        return loan;
    }
}
```

### Controllers

Controllers are thin HTTP handlers. They parse the request, delegate to a service, and format the response.

**Rules:**

- One controller per resource, inheriting from `ControllerBase` with the `[ApiController]` attribute.
- Route prefix: `[Route("api/v1/[controller]")]`.
- Controller methods return `ActionResult<T>` (or `IActionResult` for non-typed responses).
- Use attribute routing: `[HttpGet]`, `[HttpPost]`, `[HttpPut("{id}")]`, `[HttpDelete("{id}")]`.
- Authorization is declared via `[Authorize]` and `[Authorize(Roles = "Admin")]` attributes.
- Request validation is handled automatically by FluentValidation via the validation filter in the pipeline. Controllers do not manually validate.
- Response patterns:
  - `return Ok(response)` for 200.
  - `return CreatedAtAction(nameof(GetById), new { id = result.Id }, response)` for 201.
  - `return NoContent()` for 204.
  - `return Accepted()` for 202.

**Example:**

```csharp
[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class LoansController : ControllerBase
{
    private readonly ILoanService _loanService;
    private readonly IMapper _mapper;

    public LoansController(ILoanService loanService, IMapper mapper)
    {
        _loanService = loanService;
        _mapper = mapper;
    }

    [HttpPost]
    public async Task<ActionResult<LoanResponse>> CreateLoan(CreateLoanRequest request)
    {
        var userId = User.GetUserId(); // Extension method on ClaimsPrincipal
        var loan = await _loanService.CreateLoanAsync(request, userId);
        var response = _mapper.Map<LoanResponse>(loan);
        return CreatedAtAction(nameof(GetById), new { id = loan.Id }, response);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<LoanResponse>> GetById(Guid id)
    {
        var loan = await _loanService.GetByIdAsync(id);
        var response = _mapper.Map<LoanResponse>(loan);
        return Ok(response);
    }
}
```

### DTOs and Validation

**DTOs:**

- Request DTOs are named `<Action><Entity>Request` (e.g., `CreateLoanRequest`).
- Response DTOs are named `<Entity>Response` (e.g., `LoanResponse`).
- DTOs live in `LendQ.Application/DTOs/`.
- Never expose entity classes directly in API responses. Always map to a response DTO.
- Monetary fields use `decimal`. Date fields use `DateTime` or `DateOnly`.
- Mapping between entities and DTOs uses AutoMapper profiles defined in `LendQ.Application/Mapping/`.

**Validation:**

All request validation uses **FluentValidation**. Validators are registered in the DI container and invoked automatically via a validation filter.

```csharp
public class CreateLoanRequestValidator : AbstractValidator<CreateLoanRequest>
{
    public CreateLoanRequestValidator()
    {
        RuleFor(x => x.Description)
            .NotEmpty()
            .MaximumLength(500);

        RuleFor(x => x.Amount)
            .GreaterThan(0)
            .PrecisionScale(12, 2, ignoreTrailingZeros: true);

        RuleFor(x => x.BorrowerId)
            .NotEmpty();

        RuleFor(x => x.InterestRate)
            .InclusiveBetween(0, 100)
            .When(x => x.InterestRate.HasValue);
    }
}
```

**Rules:**

- One validator class per request DTO.
- Validators live in `LendQ.Application/Validators/`.
- Validators are registered via `builder.Services.AddValidatorsFromAssemblyContaining<CreateLoanRequestValidator>()`.
- The validation filter returns a `ProblemDetails` response with field-level errors on validation failure.

### Error Handling

**Exception hierarchy:**

```
AppException (500)
├── AuthenticationException  (401)
├── AuthorizationException   (403)
├── NotFoundException        (404)
├── ConflictException        (409)
└── ValidationException      (422)
```

All exception classes are defined in `LendQ.Core/Exceptions/`.

**Global exception filter:**

A global exception filter (`GlobalExceptionFilter`) maps domain exceptions to `ProblemDetails` responses:

```csharp
public class GlobalExceptionFilter : IExceptionFilter
{
    public void OnException(ExceptionContext context)
    {
        var problemDetails = context.Exception switch
        {
            NotFoundException ex => new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Not Found",
                Detail = ex.Message,
                Type = "https://tools.ietf.org/html/rfc9110#section-15.5.5"
            },
            AuthorizationException ex => new ProblemDetails { ... },
            ConflictException ex => new ProblemDetails { ... },
            _ => new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "Internal Server Error",
                Detail = "An unexpected error occurred."
            }
        };

        context.Result = new ObjectResult(problemDetails)
        {
            StatusCode = problemDetails.Status
        };
        context.ExceptionHandled = true;
    }
}
```

**Rules:**

- Error responses follow the RFC 9457 `ProblemDetails` format.
- Never expose stack traces, internal paths, or SQL in error responses.
- Services raise domain exceptions. Controllers do not catch them -- the global exception filter converts them to ProblemDetails responses.
- The `ProblemDetails` response includes a `traceId` extension property populated from the request's trace identifier.

### Middleware and Filters

| Component | Type | Purpose |
|---|---|---|
| Request ID | Middleware | Generate/propagate `X-Request-ID` header |
| Security headers | Middleware | HSTS, CSP, X-Frame-Options, X-Content-Type-Options |
| Serilog request logging | Middleware | Structured HTTP request/response logging |
| Authentication | Middleware | JWT Bearer token validation via `[Authorize]` |
| Role enforcement | Attribute | `[Authorize(Roles = "Admin,Creditor")]` on controllers/actions |
| Validation | Action filter | FluentValidation integration, returns ProblemDetails on failure |
| Global exception handling | Exception filter | Maps domain exceptions to ProblemDetails |
| CORS | Middleware | Configured in `Program.cs` for Angular dev server origin |
| Rate limiting | Middleware | ASP.NET Core rate limiting middleware with fixed/sliding window policies |

**Rules:**

- Middleware is registered in `Program.cs` in the correct pipeline order.
- Authentication sets `ClaimsPrincipal` on `HttpContext.User`. Use extension methods on `ClaimsPrincipal` to extract `UserId`, `Email`, and `Roles`.
- Action filters are registered globally or per-controller via `[ServiceFilter]` or `[TypeFilter]`.
- CORS must be configured to allow the Angular dev server origin (`http://localhost:4200`) in development.

### Background Jobs

**Short-lived / fire-and-forget:**

Use `IHostedService` or `BackgroundService` for lightweight background tasks:

```csharp
public class NotificationCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<NotificationCleanupService> _logger;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            // Cleanup logic...
            _logger.LogInformation("Notification cleanup completed");

            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }
}
```

**Scheduled / recurring:**

Use **Hangfire** for scheduled and recurring jobs that require persistence, retries, and dashboard visibility:

```csharp
// Registration in Program.cs
builder.Services.AddHangfire(config =>
    config.UsePostgreSqlStorage(connectionString));
builder.Services.AddHangfireServer();

// Recurring job setup
RecurringJob.AddOrUpdate<IPaymentReminderService>(
    "send-payment-reminders",
    service => service.SendRemindersAsync(),
    Cron.Daily(9));
```

**Rules:**

- `BackgroundService` implementations must create their own `IServiceScope` to resolve scoped services.
- Hangfire jobs must be idempotent. They may be retried on failure.
- Background jobs must not reference `HttpContext` or any request-scoped objects. They receive all needed data as method parameters.
- Log job start, completion, and failure at appropriate levels.
- Job classes are registered in DI and injected into Hangfire via `IServiceProvider`.

### Testing

**Structure:**

```
LendQ.Tests/
├── Unit/
│   ├── Services/
│   │   ├── LoanServiceTests.cs
│   │   └── ...
│   └── Validators/
│       ├── CreateLoanRequestValidatorTests.cs
│       └── ...
├── Integration/
│   ├── Controllers/
│   │   ├── LoansControllerTests.cs
│   │   └── ...
│   └── CustomWebApplicationFactory.cs
└── Security/
    ├── AuthorizationTests.cs
    └── ...
```

**Rules:**

- Use **xUnit** exclusively. No MSTest or NUnit.
- Use **Moq** for mocking dependencies in unit tests.
- Use **FluentAssertions** for readable assertion syntax.
- Test classes are named `<ClassUnderTest>Tests` (e.g., `LoanServiceTests`).
- Test methods are named `<Method>_<Scenario>_<ExpectedResult>` (e.g., `CreateLoanAsync_ValidRequest_ReturnsLoan`).
- Integration tests use `WebApplicationFactory<Program>` with a custom factory that configures an in-memory or test database.
- Each test is independent and does not depend on execution order.
- Test data is created using builder or factory helper methods.

**Example unit test:**

```csharp
public class LoanServiceTests
{
    private readonly Mock<ILoanRepository> _loanRepoMock = new();
    private readonly Mock<ILogger<LoanService>> _loggerMock = new();
    private readonly LoanService _sut;

    public LoanServiceTests()
    {
        _sut = new LoanService(_loanRepoMock.Object, ..., _loggerMock.Object);
    }

    [Fact]
    public async Task CreateLoanAsync_ValidRequest_ReturnsLoan()
    {
        // Arrange
        var request = new CreateLoanRequest { Description = "Test", Amount = 1000m };

        // Act
        var result = await _sut.CreateLoanAsync(request, Guid.NewGuid());

        // Assert
        result.Should().NotBeNull();
        result.Description.Should().Be("Test");
        _loanRepoMock.Verify(r => r.AddAsync(It.IsAny<Loan>()), Times.Once);
    }
}
```

**Example integration test:**

```csharp
public class LoansControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public LoansControllerTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetById_ExistingLoan_Returns200()
    {
        // Arrange — seed data via factory
        var response = await _client.GetAsync("/api/v1/loans/{id}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var loan = await response.Content.ReadFromJsonAsync<LoanResponse>();
        loan.Should().NotBeNull();
    }
}
```

### Code Style

#### Naming

| Element | Convention | Example |
|---|---|---|
| Classes | `PascalCase` | `LoanService`, `LoanResponse` |
| Interfaces | `IPascalCase` | `ILoanService`, `ILoanRepository` |
| Methods | `PascalCase` | `CreateLoanAsync()`, `GetByEmailAsync()` |
| Properties | `PascalCase` | `FirstName`, `CreatedAt` |
| Private fields | `_camelCase` | `_loanRepository`, `_logger` |
| Local variables | `camelCase` | `loanCount`, `userId` |
| Constants | `PascalCase` | `MaxRetryCount`, `DefaultPageSize` |
| Enums | `PascalCase` (type and members) | `LoanStatus.Active`, `UserRole.Admin` |
| Async methods | `Async` suffix | `CreateLoanAsync()`, `GetByIdAsync()` |
| Test methods | `Method_Scenario_Expected` | `CreateLoanAsync_ValidRequest_ReturnsLoan` |
| Namespaces | Match folder structure | `LendQ.Application.Services` |

#### File Organization

- One class per file. The file name matches the class name (e.g., `LoanService.cs`).
- Folder-per-layer within each project (e.g., `Services/`, `DTOs/`, `Validators/`).
- Extension method classes are named `<Target>Extensions` and live in an `Extensions/` folder.

#### Imports (Using Directives)

Using directives are ordered:

1. `System.*` namespaces
2. `Microsoft.*` namespaces
3. Third-party namespaces (`FluentValidation`, `Serilog`, `AutoMapper`, `Hangfire`)
4. Solution namespaces (`LendQ.Core`, `LendQ.Application`, `LendQ.Infrastructure`)

Enable `ImplicitUsings` in project files for common System namespaces. Use global usings in a `GlobalUsings.cs` file for frequently used project-specific namespaces.

#### XML Documentation

All public methods in services and repositories must have **XML documentation comments**:

```csharp
/// <summary>
/// Records a payment against a loan's scheduled installments.
/// </summary>
/// <remarks>
/// Allocates the payment amount to outstanding installments in due-date order.
/// Updates the loan status to PaidOff if the balance reaches zero.
/// </remarks>
/// <param name="loanId">The ID of the loan to record payment against.</param>
/// <param name="request">Validated payment request (amount, paid date, notes).</param>
/// <param name="userId">The authenticated user recording the payment.</param>
/// <returns>The created payment record.</returns>
/// <exception cref="NotFoundException">If the loan does not exist.</exception>
/// <exception cref="AuthorizationException">If the user is not a participant of the loan.</exception>
/// <exception cref="ValidationException">If no outstanding installments exist.</exception>
public async Task<Payment> RecordPaymentAsync(Guid loanId, RecordPaymentRequest request, Guid userId)
```

Controllers do not require full XML docs -- the route, HTTP method, and action name should be self-descriptive.

#### Serialization

- Use `System.Text.Json` as the JSON serializer. Do not add Newtonsoft.Json unless a specific third-party library requires it.
- Configure `JsonNamingPolicy.CamelCase` globally in `Program.cs`.
- Configure `JsonIgnoreCondition.WhenWritingNull` to omit null properties from responses.
- Use `[JsonPropertyName]` only when the JSON property name must differ from the C# convention.
- Use `[JsonConverter]` for custom serialization of enums, dates, or complex types.

#### Logging

- Use Serilog with structured JSON output configured in `appsettings.json`.
- Inject `ILogger<T>` via constructor injection. Do not create loggers manually.
- Use structured log message templates with named placeholders: `_logger.LogInformation("Loan {LoanId} created by {UserId}", loanId, userId)`.
- Never log secrets, passwords, tokens, or full request bodies.
- Use appropriate log levels: `Debug` for development diagnostics, `Information` for significant business events, `Warning` for recoverable issues, `Error` for failures requiring attention.

#### Linting and Formatting

- **Formatter**: `dotnet format` enforced by `.editorconfig` in the solution root.
- **Analyzers**: StyleCop analyzers configured in `Directory.Build.props` or individual project files.
- Both are enforced in CI. Run `dotnet format --verify-no-changes` before committing.
- The `.editorconfig` defines indentation (4 spaces), naming rules, and code style preferences.

---

## Frontend Conventions (TypeScript / Angular)

### Frontend Project Structure

```
frontend/
├── angular.json
├── package.json
├── tsconfig.json
├── src/
│   ├── main.ts
│   ├── index.html
│   ├── styles.scss                # Angular Material theme + global styles
│   ├── app/
│   │   ├── app.component.ts
│   │   ├── app.routes.ts
│   │   ├── app.config.ts
│   │   ├── core/                  # Singleton services, guards, interceptors
│   │   │   ├── auth/
│   │   │   ├── api/
│   │   │   └── services/
│   │   ├── features/              # Lazy-loaded feature modules
│   │   │   ├── dashboard/
│   │   │   ├── loans/
│   │   │   ├── payments/
│   │   │   ├── users/
│   │   │   ├── notifications/
│   │   │   └── settings/
│   │   ├── shared/                # Shared components, pipes, directives
│   │   └── layout/
│   └── environments/
```

**Rules:**

- Features are organized under `features/` by domain (`loans/`, `payments/`, `dashboard/`), not by technical type.
- Each feature directory contains its components, services, models, and route definitions.
- Singleton services, guards, and interceptors live in `core/`. These are provided in `root` and instantiated once.
- Shared components, pipes, and directives live in `shared/`. These are generic, reusable, and unaware of business logic.
- Layout components (sidenav, header, footer) live in `layout/`.
- No barrel files (`index.ts` re-exporting everything). Import directly from the source file.

### Components

**Rules:**

- All components are **standalone components** (no NgModules). Set `standalone: true` in the `@Component` decorator.
- Use **OnPush change detection** for all components: `changeDetection: ChangeDetectionStrategy.OnPush`.
- Components import their own dependencies (other components, directives, pipes, Angular Material modules) in the `imports` array.
- Use **Angular Signals** for component-local state where appropriate (Angular 18+).

**Component structure:**

```typescript
// loan-list.component.ts
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { LoanService } from '../../core/services/loan.service';
import { Loan } from '../../core/models/loan.model';

@Component({
  selector: 'app-loan-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule],
  templateUrl: './loan-list.component.html',
  styleUrl: './loan-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoanListComponent {
  private readonly loanService = inject(LoanService);

  loans = signal<Loan[]>([]);
  isLoading = signal(true);
  displayedColumns = ['description', 'amount', 'status', 'actions'];

  ngOnInit(): void {
    this.loanService.getLoans().subscribe({
      next: (loans) => {
        this.loans.set(loans);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }
}
```

**Naming:**

| Element | Convention | Example |
|---|---|---|
| Component files | `kebab-case.component.ts` | `loan-list.component.ts` |
| Service files | `kebab-case.service.ts` | `loan.service.ts` |
| Guard files | `kebab-case.guard.ts` | `auth.guard.ts` |
| Interceptor files | `kebab-case.interceptor.ts` | `auth.interceptor.ts` |
| Pipe files | `kebab-case.pipe.ts` | `currency-format.pipe.ts` |
| Directive files | `kebab-case.directive.ts` | `auto-focus.directive.ts` |
| Model files | `kebab-case.model.ts` | `loan.model.ts` |
| Component classes | `PascalCase` + suffix | `LoanListComponent` |
| Service classes | `PascalCase` + suffix | `LoanService` |
| Selectors | `app-kebab-case` | `app-loan-list` |
| Event emitters | `camelCase` | `loanSelected`, `formSubmitted` |

**Dependency injection:**

- Prefer the `inject()` function over constructor injection for cleaner syntax (Angular 14+).
- Services are provided in `root` unless they are feature-scoped.

### State Management

**Hierarchy (prefer top to bottom):**

1. **Angular Signals** (`signal()`, `computed()`, `effect()`) -- for component-local reactive state.
2. **RxJS in services** (`BehaviorSubject<T>` / `ReplaySubject<T>`) -- for shared state across components.
3. **URL state** (Angular Router query params) -- for filters, tabs, pagination that should survive navigation.
4. **No NgRx.** Keep state management simple with RxJS subjects in services.

**RxJS rules:**

- Services expose state as `Observable<T>` via `.asObservable()`. Never expose the `Subject` directly.
- Components subscribe using the `async` pipe in templates. Avoid manual `.subscribe()` in components unless absolutely necessary.
- Use `takeUntilDestroyed()` (Angular 16+) for subscriptions that must be cleaned up.
- Use `distinctUntilChanged()`, `shareReplay(1)`, and `debounceTime()` appropriately.
- Avoid nested subscriptions. Use `switchMap`, `concatMap`, or `mergeMap` instead.

**Auth state:**

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUser$ = new BehaviorSubject<User | null>(null);
  readonly user$ = this.currentUser$.asObservable();
  readonly isAuthenticated$ = this.user$.pipe(map(user => !!user));

  // login, logout, signup, token refresh methods...
}
```

### HTTP Client and API Integration

**Rules:**

- Use Angular `HttpClient` provided via `provideHttpClient(withInterceptors([...]))` in `app.config.ts`.
- API services live in `core/api/` and encapsulate HTTP calls for each resource.
- API methods are typed with generics: `this.http.get<Loan[]>('/api/v1/loans')`.
- Base URL is configured via the `environment.ts` files or a proxy configuration.

**Interceptors:**

Interceptors use the **functional interceptor** pattern (Angular 15+):

```typescript
// auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req);
};

// error.interceptor.ts
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );
};
```

**Registration in `app.config.ts`:**

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideAnimationsAsync(),
  ],
};
```

**Paginated responses** use a shared interface:

```typescript
export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

### Forms and Validation

**Stack:** Angular Reactive Forms.

**Rules:**

- Use **Reactive Forms** (`FormGroup`, `FormControl`, `Validators`) for all forms. Template-driven forms are not permitted.
- Form groups are built in the component class using `FormBuilder` or the `inject(FormBuilder)` function.
- Validation messages are displayed inline below each `mat-form-field` using `<mat-error>`.
- Submit buttons show a loading state during submission.
- Custom validators are defined as standalone functions in a `validators/` directory.

**Example pattern:**

```typescript
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
      <mat-form-field appearance="outline">
        <mat-label>Email</mat-label>
        <input matInput formControlName="email" type="email" />
        <mat-error *ngIf="loginForm.controls.email.hasError('required')">
          Email is required
        </mat-error>
        <mat-error *ngIf="loginForm.controls.email.hasError('email')">
          Invalid email format
        </mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Password</mat-label>
        <input matInput formControlName="password" type="password" />
        <mat-error *ngIf="loginForm.controls.password.hasError('required')">
          Password is required
        </mat-error>
      </mat-form-field>

      <button mat-raised-button color="primary" type="submit"
              [disabled]="loginForm.invalid || isSubmitting">
        {{ isSubmitting ? 'Logging in...' : 'Log in' }}
      </button>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  isSubmitting = false;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isSubmitting = true;
      // Submit logic...
    }
  }
}
```

### Styling

**Stack:** Angular Material theme (Material Design 3) + component SCSS files.

**Rules:**

- All interactive UI elements use **Angular Material components**: `mat-table`, `mat-dialog`, `mat-sidenav`, `mat-form-field`, `mat-snack-bar`, `mat-button`, `mat-icon`, `mat-card`, `mat-toolbar`, `mat-menu`, `mat-paginator`, etc.
- The Angular Material theme is configured in `src/styles.scss` using the `@use '@angular/material' as mat` theming API with a custom color palette.
- Component-specific styles use co-located SCSS files (`loan-list.component.scss`).
- Use Angular Material's built-in responsive utilities and breakpoints.
- Custom styling that extends Material components uses the `::ng-deep` selector sparingly. Prefer the component's public theming API.
- Responsive design uses CSS media queries or Angular CDK `BreakpointObserver`.

**Theme configuration (styles.scss):**

```scss
@use '@angular/material' as mat;

$lendq-theme: mat.define-theme((
  color: (
    theme-type: light,
    primary: mat.$azure-palette,
    tertiary: mat.$blue-palette,
  ),
  typography: (
    brand-family: 'Inter, sans-serif',
    plain-family: 'Inter, sans-serif',
  ),
));

html {
  @include mat.all-component-themes($lendq-theme);
}
```

### Routing and Navigation

**Rules:**

- All routes are defined in `src/app/app.routes.ts`.
- Feature routes are **lazy-loaded** using `loadChildren` or `loadComponent`:
  ```typescript
  {
    path: 'loans',
    loadComponent: () => import('./features/loans/loan-list.component')
      .then(m => m.LoanListComponent),
    canActivate: [authGuard],
  }
  ```
- Protected routes use functional guards: `authGuard` checks authentication, `roleGuard` checks user roles.
- The authenticated layout (`LayoutComponent`) wraps protected routes via a parent route with `<router-outlet>`.
- Navigation uses `Router.navigate()` for programmatic navigation and `routerLink` for declarative links.
- Filter state (tabs, search, status) is persisted in URL query params via `ActivatedRoute.queryParams`.

**Guard example:**

```typescript
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const user = authService.getCurrentUser();
    return user !== null && allowedRoles.includes(user.role);
  };
};
```

### Error Handling (Frontend)

**Rules:**

- API errors from the backend follow the RFC 9457 `ProblemDetails` format.
- A shared `ProblemDetails` interface in `core/models/` models this structure.
- Error notifications are displayed via `MatSnackBar`: `this.snackBar.open(message, 'Close', { duration: 5000 })`.
- Component-level errors are handled with `isError` / `errorMessage` signals, rendering an inline error state with a retry button.
- Network errors (no response) show a generic connectivity message.
- 401 errors are handled globally by the error interceptor (redirect to login).
- 403 errors show an access-denied message without exposing internal details.

### Testing (Frontend)

**Unit tests:** Jasmine + Karma (Angular CLI default).

**E2E tests:** Playwright (in `e2e/`).

**Rules:**

- All services and components with logic must have Jasmine unit test coverage.
- Test files are co-located with their source file: `loan.service.spec.ts` alongside `loan.service.ts`.
- Use Angular `TestBed` for component and service tests with dependency injection.
- Use `HttpClientTestingModule` and `HttpTestingController` for testing HTTP services.
- All pages and critical user flows must have Playwright coverage in `e2e/`.
- E2E tests are organized by feature: `e2e/tests/auth/`, `e2e/tests/loans/`, etc.
- Page objects live in `e2e/pages/` and abstract selectors away from test logic.
- Tests must use `data-testid` attributes for element selection, not CSS classes or text content.

**Example unit test:**

```typescript
describe('LoanService', () => {
  let service: LoanService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LoanService],
    });

    service = TestBed.inject(LoanService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should fetch loans', () => {
    const mockLoans: Loan[] = [{ id: '1', description: 'Test', amount: 1000 }];

    service.getLoans().subscribe(loans => {
      expect(loans).toEqual(mockLoans);
    });

    const req = httpMock.expectOne('/api/v1/loans');
    expect(req.request.method).toBe('GET');
    req.flush(mockLoans);
  });
});
```

### Code Style (Frontend)

**TypeScript:**

- Strict mode enabled (`"strict": true` in `tsconfig.json`).
- Use `interface` for object shapes and component inputs. Use `type` for unions, intersections, and utility types.
- Prefer `X | null` over `X | undefined` for explicitly absent values.
- Use `as const` for literal arrays and objects used as type sources.
- The `I` prefix is **not used** for interfaces (Angular convention).

**Formatting and linting:**

- **ESLint** with `@angular-eslint` plugin for Angular-specific rules.
- **Prettier** for code formatting.
- Import paths use relative paths within a feature and path aliases (`@app/`, `@core/`, `@shared/`) for cross-feature imports.
- Enforced in CI. Run `ng lint` and format checks before committing.

**General:**

- Use `inject()` function for dependency injection in components and services.
- Use `type` imports where possible: `import type { Loan } from '../models/loan.model'`.
- Prefer standalone components over NgModules.
- Avoid `any` type. Use `unknown` when the type is genuinely unknown and narrow it explicitly.
- Use Angular's `DestroyRef` and `takeUntilDestroyed()` for subscription cleanup instead of manual `ngOnDestroy` patterns.

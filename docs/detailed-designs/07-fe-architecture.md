# Module 7: Frontend Architecture (Blazor WebAssembly)

**Requirements**: L1-7, L1-10, L1-12, L2-7.1, L2-7.2, L2-7.3, L2-7.4, L2-7.5, L2-10.1, L2-10.2, L2-10.3, L2-12.1, L2-12.2

## Overview

The LendQ frontend is a Blazor WebAssembly SPA built with .NET 8, C# 12, Blazor built-in routing, registered HttpClient services with caching patterns, and a shared component system derived from `docs/ui-design.pen`. The frontend aligns with the secure session model, the versioned API contract, and the responsive and accessibility requirements.

## Technology Stack

| Layer | Technology |
|---|---|
| Language | C# 12 |
| UI framework | Blazor WebAssembly (.NET 8) |
| Build tool | dotnet CLI / MSBuild |
| Routing | Blazor built-in routing (@page directives, NavigationManager) |
| Server state | Registered HttpClient services with caching patterns |
| Forms | EditForm + DataAnnotationsValidator + FluentValidation |
| Styling | Tailwind CSS 4 + design tokens (via PostCSS build step) |
| Tables and lists | Virtualized rows (Blazor Virtualize component) where datasets warrant it |
| Contract types | C# DTOs generated from [docs/api/openapi.yaml](../api/openapi.yaml) |

## C4 Container Diagram

![C4 Container - Full Stack](diagrams/rendered/fe_c4_container.png)

*Source: [diagrams/plantuml/fe_c4_container.puml](diagrams/plantuml/fe_c4_container.puml)*

## C4 Component Diagram

![C4 Component - SPA](diagrams/rendered/fe_c4_component_spa.png)

*Source: [diagrams/plantuml/fe_c4_component_spa.puml](diagrams/plantuml/fe_c4_component_spa.puml)*

## Project Structure

```text
LendQ.Client/
├── Program.cs                    # WebAssembly host builder, DI registration
├── App.razor                     # Router component
├── _Imports.razor                # Global using directives
├── wwwroot/
│   ├── index.html                # Host HTML page
│   └── css/                      # Tailwind output
├── Layout/
│   ├── MainLayout.razor          # Authenticated app shell
│   ├── AuthLayout.razor          # Unauthenticated shell
│   ├── NavMenu.razor             # Sidebar / mobile nav
│   └── NavMenu.razor.css         # Scoped styles
├── Pages/
│   ├── Auth/                     # LoginPage.razor, SignUpPage.razor, etc.
│   ├── Dashboard/                # DashboardPage.razor
│   ├── Loans/                    # LoanListPage.razor, LoanDetailPage.razor
│   ├── Payments/
│   ├── Users/
│   ├── Notifications/
│   └── Settings/
├── Components/
│   ├── UI/                       # Button.razor, Input.razor, Modal.razor, etc.
│   └── Shared/                   # SummaryCards.razor, DataTable.razor, etc.
├── Services/
│   ├── ApiClient.cs              # Typed HttpClient wrapper
│   ├── AuthService.cs            # Auth state + token management
│   ├── LoanService.cs            # Loan API calls
│   ├── NotificationService.cs    # Notifications + SSE
│   └── ...
├── Models/
│   ├── ApiTypes.cs               # DTOs matching API responses
│   └── FormModels.cs             # Form input models with DataAnnotations
└── Auth/
    ├── CustomAuthStateProvider.cs # AuthenticationStateProvider implementation
    └── AuthorizeRouteView setup
```

## Route Map

| Path | Page | Auth | Roles |
|---|---|---|---|
| `/login` | `LoginPage.razor` (`@page "/login"`) | No | Any |
| `/signup` | `SignUpPage.razor` (`@page "/signup"`) | No | Any |
| `/verify-email` | `VerifyEmailPage.razor` (`@page "/verify-email"`) | No | Any |
| `/forgot-password` | `ForgotPasswordPage.razor` (`@page "/forgot-password"`) | No | Any |
| `/reset-password/{Token}` | `ResetPasswordPage.razor` (`@page "/reset-password/{Token}"`) | No | Any |
| `/dashboard` | `DashboardPage.razor` (`@page "/dashboard"`) | Yes | Admin, Creditor, Borrower |
| `/loans` | `LoanListPage.razor` (`@page "/loans"`) | Yes | Creditor, Borrower |
| `/loans/new` | `CreateLoanPage.razor` or modal component (`@page "/loans/new"`) | Yes | Creditor |
| `/loans/{Id:guid}` | `LoanDetailPage.razor` (`@page "/loans/{Id:guid}"`) | Yes | Creditor, Borrower |
| `/loans/{Id:guid}/edit` | `EditLoanPage.razor` or modal component (`@page "/loans/{Id:guid}/edit"`) | Yes | Creditor owner |
| `/users` | `UserListPage.razor` (`@page "/users"`) | Yes | Admin |
| `/users/roles` | `RoleManagementPage.razor` (`@page "/users/roles"`) | Yes | Admin |
| `/notifications` | `NotificationListPage.razor` (`@page "/notifications"`) | Yes | Any authenticated |
| `/settings/preferences` | `PreferencesPage.razor` (`@page "/settings/preferences"`) | Yes | Any authenticated |
| `/settings/security` | `SecurityPage.razor` (`@page "/settings/security"`) | Yes | Any authenticated |

Borrowers do not receive a direct loan-edit route. Borrower-initiated term or schedule changes are handled through request flows described in Modules 10 and 11.

## API Client And Session Bootstrap

![Class - API Types](diagrams/rendered/fe_class_api_types.png)

*Source: [diagrams/plantuml/fe_class_api_types.puml](diagrams/plantuml/fe_class_api_types.puml)*

The API client is a typed `HttpClient` registered in `Program.cs` via `builder.Services.AddHttpClient<ApiClient>()`. An `AuthorizationMessageHandler` (a `DelegatingHandler`) is attached to the client pipeline and adds:

- `Authorization: Bearer <access token>` from in-memory state held by `AuthService`
- `X-CSRF-Token` on cookie-authenticated endpoints
- `X-Request-Id` generation and propagation
- Single-flight refresh retry for concurrent `401` responses, coordinated through `AuthService`

A `CustomAuthStateProvider` (extending `AuthenticationStateProvider`) supplies authentication state to the Blazor component tree. Protected routes render behind `CascadingAuthenticationState` and `AuthorizeRouteView`:

1. On first load, `CustomAuthStateProvider.GetAuthenticationStateAsync()` attempts `POST /api/v1/auth/refresh` via the `AuthService`.
2. If refresh succeeds, the `ClaimsPrincipal` is populated from the access token claims and `AuthorizeRouteView` renders protected content.
3. If refresh fails, `NavigationManager` redirects to `/login` without flashing protected content.

The `App.razor` router is configured as:

```razor
<CascadingAuthenticationState>
    <Router AppAssembly="@typeof(App).Assembly">
        <Found Context="routeData">
            <AuthorizeRouteView RouteData="@routeData"
                                DefaultLayout="@typeof(MainLayout)">
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

## Responsive Shell

![Class - Layout](diagrams/rendered/fe_class_layout.png)

*Source: [diagrams/plantuml/fe_class_layout.puml](diagrams/plantuml/fe_class_layout.puml)*

The responsive shell is implemented as Blazor Razor components (`MainLayout.razor`, `NavMenu.razor`) styled with Tailwind CSS utility classes. Viewport-aware behavior is achieved via Tailwind responsive breakpoints and, where runtime detection is needed, a JS interop call to a `ResizeObserver` wrapper.

| Breakpoint | Navigation |
|---|---|
| Desktop `>=1280px` | Fixed left sidebar |
| Tablet `768-1279px` | Collapsible sidebar with top header trigger |
| Mobile `<768px` | Top header plus bottom tab bar and overflow sheet |

## Accessibility Baseline

- All dialogs trap focus and restore focus on close. Focus management is handled via JS interop (`IJSRuntime.InvokeVoidAsync("focusTrap.activate", ...)`) since Blazor WASM does not provide native focus-trap APIs.
- Forms use `EditForm` with `DataAnnotationsValidator`, and inline errors are associated to controls via `aria-describedby` attributes in Razor markup.
- Keyboard-visible focus rings are part of the shared Tailwind design token set.
- Toasts and async status messages use appropriate `aria-live` region semantics, rendered in Razor components.
- Table actions remain keyboard reachable on desktop and mobile card variants. `@onkeydown` handlers supplement click handlers where needed.

## Performance Baseline

- Login and dashboard pages are in separate lazy-loaded assemblies. Blazor WASM supports on-demand assembly loading via `LazyAssemblyLoader`, so auth pages load immediately while dashboard assemblies are fetched after authentication.
- IL trimming is enabled in the publish profile to reduce the initial download size of the .NET WASM runtime and application assemblies.
- Large user, loan, and notification lists use server-side paging and Blazor's `<Virtualize>` component where row counts justify it.
- Mutations show pending state immediately via bound `bool IsSubmitting` flags and disable duplicate submission on `EditForm`.
- AOT (Ahead-of-Time) compilation is configured for release builds to improve runtime performance of compute-heavy operations.

## Sequences

### Responsive Navigation

![Sequence - Responsive Nav](diagrams/rendered/fe_seq_responsive_nav.png)

*Source: [diagrams/plantuml/fe_seq_responsive_nav.puml](diagrams/plantuml/fe_seq_responsive_nav.puml)*

### Token Refresh

![Sequence - Token Refresh](diagrams/rendered/fe_seq_token_refresh.png)

*Source: [diagrams/plantuml/fe_seq_token_refresh.puml](diagrams/plantuml/fe_seq_token_refresh.puml)*

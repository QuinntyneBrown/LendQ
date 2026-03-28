# Module 8: Frontend - Authentication (Blazor WebAssembly)

**Requirements**: L1-1, L1-8, L1-10, L2-1.1, L2-1.2, L2-1.3, L2-1.4, L2-1.5, L2-8.1, L2-10.1, L2-10.3

**Backend API**: [01-authentication.md](01-authentication.md)

## Overview

The frontend authentication feature implements login, sign-up, verify-email, forgot-password, reset-password, session bootstrap, and session-expiry handling as Blazor WebAssembly Razor components. It uses the secure session model defined in Modules 1 and 15. Authentication state is managed by a `CustomAuthStateProvider` (extending `AuthenticationStateProvider`) and an injectable `IAuthService`, both registered in the DI container in `Program.cs`.

## Class Diagram

![Class - Auth](diagrams/rendered/fe_class_auth.png)

*Source: [diagrams/plantuml/fe_class_auth.puml](diagrams/plantuml/fe_class_auth.puml)*

## Pages

| Page | Purpose |
|---|---|
| `LoginPage.razor` (`@page "/login"`) | Collect credentials via `EditForm` and show generic auth failures |
| `SignUpPage.razor` (`@page "/signup"`) | Register account via `EditForm` and route to verification-required state |
| `VerifyEmailPage.razor` (`@page "/verify-email"`) | Confirm token and offer resend flow |
| `ForgotPasswordPage.razor` (`@page "/forgot-password"`) | Start reset flow with generic success messaging |
| `ResetPasswordPage.razor` (`@page "/reset-password/{Token}"`) | Complete reset and redirect to login via `NavigationManager` |
| `SessionExpiredDialog.razor` | Modal component that interrupts protected flows cleanly when refresh fails or session is revoked |

Each form page uses `EditForm` bound to a C# model class annotated with `DataAnnotations` attributes (e.g., `[Required]`, `[EmailAddress]`, `[MinLength]`). A `DataAnnotationsValidator` component performs client-side validation, and `ValidationMessage<T>` components display per-field error text.

## API Integration

| Action | Endpoint |
|---|---|
| Sign up | `POST /api/v1/auth/signup` |
| Login | `POST /api/v1/auth/login` |
| Refresh | `POST /api/v1/auth/refresh` |
| Current user | `GET /api/v1/auth/me` |
| Resend verification | `POST /api/v1/auth/email-verification/resend` |
| Confirm verification | `POST /api/v1/auth/email-verification/confirm` |
| Forgot password | `POST /api/v1/auth/forgot-password` |
| Reset password | `POST /api/v1/auth/reset-password` |
| Logout | `POST /api/v1/auth/logout` |

All API calls are made through `IAuthService`, which uses a typed `HttpClient` injected via DI. The service methods return typed C# DTOs deserialized from JSON responses.

## Token Storage

| Item | Storage |
|---|---|
| Access token | In-memory only, held as a private field in `AuthService` (singleton-scoped in WASM) |
| Refresh session | `Secure`, `HttpOnly`, `SameSite=Strict` cookie (managed by the server, not accessible to WASM code) |
| CSRF token | Non-sensitive cookie or bootstrapped value read via JS interop and echoed in `X-CSRF-Token` header by `AuthorizationMessageHandler` |

No auth token is stored in `localStorage` or `sessionStorage`. The `ProtectedLocalStorage` API is not used for tokens.

## Authentication State Flow

Authentication state flows through the Blazor component tree via `CascadingAuthenticationState`. Components that need the current user's identity consume it in one of two ways:

1. **Injecting `IAuthService`**: For imperative access to the current user, roles, and auth operations (login, logout, refresh).
2. **`[CascadingParameter] Task<AuthenticationState>`**: For declarative access to the `ClaimsPrincipal` within Razor component markup, used with `<AuthorizeView>` to conditionally render UI based on roles.

The `CustomAuthStateProvider` notifies the component tree of auth state changes by calling `NotifyAuthenticationStateChanged()`, which triggers re-renders of any component consuming the cascading `Task<AuthenticationState>`.

## Sequence Diagram

![Sequence - Login](diagrams/rendered/fe_seq_login.png)

*Source: [diagrams/plantuml/fe_seq_login.puml](diagrams/plantuml/fe_seq_login.puml)*

## UX Rules

- Sign-up success clearly communicates that email verification is required before normal use. The `SignUpPage.razor` component transitions to a confirmation state within the same page.
- Session bootstrap blocks protected routes until `CustomAuthStateProvider.GetAuthenticationStateAsync()` resolves. `AuthorizeRouteView` shows a loading indicator during this period.
- Session-expired responses trigger `SessionExpiredDialog.razor`, which preserves safe unsaved form state where possible via component parameters, then routes the user to re-authenticate using `NavigationManager.NavigateTo("/login")`.
- Auth pages use `AuthLayout.razor` and support mobile, tablet, and desktop layouts via Tailwind responsive classes.

## Error Handling

- Login, sign-up, and forgot-password flows use generic user-facing auth failures where enumeration is a risk. Error messages are bound to a `string? ErrorMessage` property and rendered conditionally in Razor.
- Field-level validation errors returned by the API are mapped to the `EditContext` via `ValidationMessageStore`, so they appear inline next to the relevant form fields.
- Duplicate submit is prevented by binding the submit button's `disabled` attribute to a `bool IsSubmitting` flag that is set to `true` on `HandleValidSubmit` and reset on completion.

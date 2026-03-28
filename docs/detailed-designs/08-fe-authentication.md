# Module 8: Frontend - Authentication

**Requirements**: L1-1, L1-8, L1-10, L2-1.1, L2-1.2, L2-1.3, L2-1.4, L2-1.5, L2-8.1, L2-10.1, L2-10.3

**Backend API**: [01-authentication.md](01-authentication.md)

## Overview

The frontend authentication feature implements login, sign-up, verify-email, forgot-password, reset-password, session bootstrap, and session-expiry handling. It uses the secure session model defined in Modules 1 and 15. Authentication state is managed by `AuthService`, an `@Injectable` singleton that exposes a `BehaviorSubject<User | null>` for reactive state propagation throughout the application.

## Class Diagram

![Class - Auth](diagrams/rendered/fe_class_auth.png)

*Source: [diagrams/plantuml/fe_class_auth.puml](diagrams/plantuml/fe_class_auth.puml)*

## Components

| Component | Purpose |
|---|---|
| `LoginComponent` | Collect credentials via Reactive Forms and show generic auth failures |
| `SignUpComponent` | Register account and route to verification-required state |
| `VerifyEmailComponent` | Confirm token and offer resend flow |
| `ForgotPasswordComponent` | Start reset flow with generic success messaging |
| `ResetPasswordComponent` | Complete reset and redirect to login |
| `SessionExpiredDialogComponent` | MatDialog that interrupts protected flows cleanly when refresh fails or session is revoked |

## AuthService

`AuthService` is an `@Injectable({ providedIn: 'root' })` service that manages authentication state:

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();
  private accessToken: string | null = null;

  getAccessToken(): string | null { return this.accessToken; }
  isAuthenticated(): boolean { return this.accessToken !== null; }
}
```

- `user$` observable is consumed by components and guards via the `async` pipe and RxJS operators.
- `tryRefresh()` is called by `APP_INITIALIZER` on application startup.
- `login()`, `logout()`, and `signup()` methods return `Observable` results and update the `BehaviorSubject` on success.

## Guards

| Guard | Type | Purpose |
|---|---|---|
| `authGuard` | `CanActivateFn` | Checks `AuthService.isAuthenticated()`, redirects to `/login` if false |
| `roleGuard` | `CanActivateFn` | Reads `route.data['roles']` array, checks user role membership |
| `guestGuard` | `CanActivateFn` | Redirects authenticated users away from login/signup to `/dashboard` |

Guards are registered on route definitions in `app.routes.ts`:

```typescript
{ path: 'dashboard', loadComponent: () => ..., canActivate: [authGuard] },
{ path: 'users', loadComponent: () => ..., canActivate: [authGuard, roleGuard], data: { roles: ['admin'] } },
```

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

## Token Storage

| Item | Storage |
|---|---|
| Access token | Memory only inside `AuthService` (private field) |
| Refresh session | `Secure`, `HttpOnly`, `SameSite=Strict` cookie |
| CSRF token | Non-sensitive cookie or bootstrapped value read by the client and echoed in `X-CSRF-Token` |

No auth token is stored in `localStorage` or `sessionStorage`.

## Auth Interceptor

The `authInterceptor` is a functional `HttpInterceptorFn` registered in `app.config.ts`:

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
```

The `errorInterceptor` handles 401 responses by attempting a token refresh via `AuthService.tryRefresh()`. If refresh fails, it redirects to `/login` via `Router.navigate`. Concurrent 401 responses share a single refresh attempt using RxJS `shareReplay`.

## Sequence Diagram

![Sequence - Login](diagrams/rendered/fe_seq_login.png)

*Source: [diagrams/plantuml/fe_seq_login.puml](diagrams/plantuml/fe_seq_login.puml)*

## UX Rules

- Sign-up success clearly communicates that email verification is required before normal use.
- Session bootstrap via `APP_INITIALIZER` blocks protected routes until refresh either succeeds or fails.
- Session-expired responses preserve safe unsaved form state where possible via `MatDialog`, then route the user to re-authenticate.
- Auth screens reuse the shared auth shell layout and support mobile, tablet, and desktop layouts using Angular Material responsive patterns.

## Login Form Example

The `LoginComponent` uses Angular Reactive Forms with Material form fields:

```typescript
@Component({ changeDetection: ChangeDetectionStrategy.OnPush })
export class LoginComponent {
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });
  submitting = signal(false);

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.submitting.set(true);
    this.authService.login(this.loginForm.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.router.navigate(['/dashboard']), error: () => this.submitting.set(false) });
  }
}
```

## Error Handling

- Login, sign-up, and forgot-password flows use generic user-facing auth failures where enumeration is a risk.
- Field-level validation is mapped from API `details` to `FormControl` errors via the error interceptor.
- Duplicate submit is prevented by disabling the submit button while a request is in flight, tracked via Angular signals or a `submitting` flag.

# Module 7: Frontend Architecture (Angular)

**Requirements**: L1-7, L1-10, L1-12, L2-7.1, L2-7.2, L2-7.3, L2-7.4, L2-7.5, L2-10.1, L2-10.2, L2-10.3, L2-12.1, L2-12.2

## Overview

The LendQ frontend is an Angular SPA built with TypeScript, Angular CLI, Angular Router, Angular HttpClient with RxJS, and Angular Material components derived from `docs/ui-design.pen`. The frontend aligns with the secure session model, the versioned API contract, and the responsive and accessibility requirements.

## Technology Stack

| Layer | Technology |
|---|---|
| Language | TypeScript 5 |
| UI framework | Angular 18 |
| Build tool | Angular CLI (ng) |
| Routing | Angular Router with lazy-loaded route configs |
| Server state | Angular HttpClient + RxJS Observables |
| Forms | Reactive Forms (FormGroup, FormControl, Validators) |
| Styling | Angular Material components + custom theme (Material Design 3) |
| Tables and lists | CDK Virtual Scrolling where datasets warrant it |
| Contract types | Generated from [docs/api/openapi.yaml](../api/openapi.yaml) |

## C4 Container Diagram

![C4 Container - Full Stack](diagrams/rendered/fe_c4_container.png)

*Source: [diagrams/plantuml/fe_c4_container.puml](diagrams/plantuml/fe_c4_container.puml)*

## C4 Component Diagram

![C4 Component - SPA](diagrams/rendered/fe_c4_component_spa.png)

*Source: [diagrams/plantuml/fe_c4_component_spa.puml](diagrams/plantuml/fe_c4_component_spa.puml)*

## Project Structure

```text
frontend/
├── angular.json
├── package.json
├── tsconfig.json
├── src/
│   ├── main.ts                    # Bootstrap
│   ├── index.html
│   ├── styles.scss                # Global styles + Material theme
│   ├── app/
│   │   ├── app.component.ts       # Root component
│   │   ├── app.routes.ts          # Route definitions
│   │   ├── app.config.ts          # App configuration + providers
│   │   ├── core/                  # Singleton services, guards, interceptors
│   │   │   ├── auth/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.guard.ts
│   │   │   │   ├── auth.interceptor.ts
│   │   │   │   └── auth.models.ts
│   │   │   ├── api/
│   │   │   │   └── api.service.ts
│   │   │   └── services/
│   │   │       ├── toast.service.ts
│   │   │       └── notification-stream.service.ts
│   │   ├── features/
│   │   │   ├── auth/              # Login, signup, forgot-password
│   │   │   ├── dashboard/
│   │   │   ├── loans/
│   │   │   ├── payments/
│   │   │   ├── users/
│   │   │   ├── notifications/
│   │   │   └── settings/
│   │   ├── shared/                # Shared components, pipes, directives
│   │   │   ├── components/
│   │   │   └── pipes/
│   │   └── layout/
│   │       ├── main-layout/
│   │       ├── sidebar/
│   │       └── header/
│   └── environments/
│       ├── environment.ts
│       └── environment.prod.ts
```

## Route Map

| Path | Component | Auth | Roles |
|---|---|---|---|
| `/login` | `LoginComponent` | No | Any |
| `/signup` | `SignUpComponent` | No | Any |
| `/verify-email` | `VerifyEmailComponent` | No | Any |
| `/forgot-password` | `ForgotPasswordComponent` | No | Any |
| `/reset-password/:token` | `ResetPasswordComponent` | No | Any |
| `/dashboard` | `DashboardComponent` | Yes | Admin, Creditor, Borrower |
| `/loans` | `LoanListComponent` | Yes | Creditor, Borrower |
| `/loans/new` | `CreateLoanComponent` or dialog route | Yes | Creditor |
| `/loans/:id` | `LoanDetailComponent` | Yes | Creditor, Borrower |
| `/loans/:id/edit` | `EditLoanComponent` or dialog route | Yes | Creditor owner |
| `/users` | `UserListComponent` | Yes | Admin |
| `/users/roles` | `RoleManagementComponent` | Yes | Admin |
| `/notifications` | `NotificationListComponent` | Yes | Any authenticated |
| `/settings/preferences` | `PreferencesComponent` | Yes | Any authenticated |
| `/settings/security` | `SecurityComponent` | Yes | Any authenticated |

Routes are defined in `app.routes.ts` using Angular's `Routes` array with `loadComponent` for lazy loading:

```typescript
export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [authGuard] },
  // ...
];
```

Borrowers do not receive a direct loan-edit route. Borrower-initiated term or schedule changes are handled through request flows described in Modules 10 and 11.

## API Client And Session Bootstrap

![Class - API Types](diagrams/rendered/fe_class_api_types.png)

*Source: [diagrams/plantuml/fe_class_api_types.puml](diagrams/plantuml/fe_class_api_types.puml)*

The API client uses Angular `HttpClient` wrapped by functional interceptors (`HttpInterceptorFn`) that add:

- `Authorization: Bearer <access token>` from in-memory `AuthService` state only
- `X-CSRF-Token` on cookie-authenticated endpoints
- `X-Request-Id` generation and propagation
- single-flight refresh retry for concurrent `401` responses via a custom error interceptor

Interceptors are registered in `app.config.ts`:

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
  ],
};
```

Protected routes render behind an `APP_INITIALIZER` session bootstrap:

1. On first load, `APP_INITIALIZER` calls `AuthService.tryRefresh()` which attempts `POST /api/v1/auth/refresh`.
2. If refresh succeeds, `AuthService.user$` (a `BehaviorSubject<User | null>`) is hydrated and protected routes render.
3. If refresh fails, `AuthGuard` (`CanActivateFn`) redirects to `/login` without flashing protected content.

## Responsive Shell

![Class - Layout](diagrams/rendered/fe_class_layout.png)

*Source: [diagrams/plantuml/fe_class_layout.puml](diagrams/plantuml/fe_class_layout.puml)*

The responsive shell uses Angular Material's `mat-sidenav-container`, `mat-sidenav`, and `mat-toolbar` components. `BreakpointObserver` from `@angular/cdk/layout` drives layout changes:

| Breakpoint | Navigation |
|---|---|
| Desktop `>=1280px` | Fixed left `mat-sidenav` in `side` mode |
| Tablet `768-1279px` | Collapsible `mat-sidenav` in `over` mode with `mat-toolbar` trigger |
| Mobile `<768px` | `mat-toolbar` header plus bottom tab bar and overflow sheet |

## Accessibility Baseline

- All dialogs (`MatDialog`) trap focus via Angular CDK `FocusTrap` and restore focus on close.
- Forms associate inline errors to controls via `aria-describedby` using Angular Material's `mat-error` within `mat-form-field`.
- Keyboard-visible focus rings are part of the Angular Material theme and custom design token set.
- Toasts (`MatSnackBar`) and async status messages use `LiveAnnouncer` from `@angular/cdk/a11y` for appropriate live-region semantics.
- Table actions remain keyboard reachable on desktop `mat-table` and mobile card variants.

## Performance Baseline

- Login and dashboard are separate lazy-loaded entry routes via `loadComponent`.
- Initial auth route JS budget targets a compact first load; dashboard feature modules are lazy-loaded after authentication.
- Large user, loan, and notification lists use paging and CDK Virtual Scrolling (`cdk-virtual-scroll-viewport`) where row counts justify it.
- Mutations show pending state immediately and disable duplicate submission.
- Components use `ChangeDetectionStrategy.OnPush` with RxJS Observables and the `async` pipe for efficient change detection.
- `PreloadAllModules` strategy preloads lazy routes in the background after initial load.

## Sequences

### Responsive Navigation

![Sequence - Responsive Nav](diagrams/rendered/fe_seq_responsive_nav.png)

*Source: [diagrams/plantuml/fe_seq_responsive_nav.puml](diagrams/plantuml/fe_seq_responsive_nav.puml)*

### Token Refresh

![Sequence - Token Refresh](diagrams/rendered/fe_seq_token_refresh.png)

*Source: [diagrams/plantuml/fe_seq_token_refresh.puml](diagrams/plantuml/fe_seq_token_refresh.puml)*

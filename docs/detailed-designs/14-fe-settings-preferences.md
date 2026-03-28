# Module 14: Frontend - Settings & Preferences

**Requirements**: L1-1, L1-6, L1-10, L2-1.4, L2-6.5, L2-10.1, L2-10.3

**Backend APIs**: [01-authentication.md](01-authentication.md), [06-notifications.md](06-notifications.md)

## Overview

The settings area closes the previous gap between routed navigation and actual design coverage. It contains two authenticated screens:

- `PreferencesComponent` at `/settings/preferences`
- `SecurityComponent` at `/settings/security`

Both screens use the shared app shell, share the responsive breakpoints defined in Module 7, and follow the same loading, empty, success, and error-state rules as the rest of the SPA. Components are Angular standalone components using Angular Material, Reactive Forms, and `@Injectable` services.

## Screen Responsibilities

| Screen | Purpose |
|---|---|
| `PreferencesComponent` | Manage email notification preferences by category using `mat-slide-toggle` while keeping in-app notifications enabled |
| `SecurityComponent` | View active sessions in `mat-table`, revoke a specific session, log out all other sessions, and review key account-security state such as email verification and last password change |

## Preferences Component

### Layout

- Desktop: two-column content area with a `mat-card` preference form and a `mat-card` help/status card
- Tablet: stacked `mat-card` elements with inline save status
- Mobile: single-column layout with full-width `mat-slide-toggle` elements and sticky save bar

### Notification Preference Categories

| Preference key | Label | Default |
|---|---|---|
| `payment_due_email` | Payment due reminders | Enabled |
| `payment_overdue_email` | Overdue payment alerts | Enabled |
| `payment_received_email` | Payment received confirmations | Enabled |
| `schedule_changed_email` | Schedule change updates | Enabled |
| `loan_modified_email` | Loan term change updates | Enabled |
| `system_email` | System notices | Disabled |

### Preferences Form

The `PreferencesComponent` uses Reactive Forms with `mat-slide-toggle` for each preference:

```typescript
this.preferencesForm = new FormGroup({
  payment_due_email: new FormControl(true),
  payment_overdue_email: new FormControl(true),
  payment_received_email: new FormControl(true),
  schedule_changed_email: new FormControl(true),
  loan_modified_email: new FormControl(true),
  system_email: new FormControl(false),
});
```

Template binds each toggle:

```html
<mat-slide-toggle formControlName="payment_due_email">Payment due reminders</mat-slide-toggle>
<mat-slide-toggle formControlName="payment_overdue_email">Overdue payment alerts</mat-slide-toggle>
```

### UX Rules

- In-app notifications are always on for supported events and are not toggleable.
- Toggle changes update a dirty-state banner (tracked via `this.preferencesForm.dirty`) and enable the primary `Save preferences` `mat-raised-button`.
- A successful save shows a non-blocking success toast via `MatSnackBar`.
- Recoverable save failures keep form state intact and render inline `mat-error` messaging.

## Security Component

### Session Inventory

The `SecurityComponent` displays active sessions in a `mat-table`:

```typescript
displayedColumns = ['device', 'location', 'created', 'lastUsed', 'status', 'actions'];
```

Each active session row shows:

- device or user-agent summary
- IP-derived geo hint when available
- created time
- last used time
- current-session badge (`mat-chip`)
- revoke action (`mat-icon-button` with `delete` icon)

### SecurityService

`SecurityService` is an `@Injectable({ providedIn: 'root' })` service:

```typescript
@Injectable({ providedIn: 'root' })
export class SecurityService {
  constructor(private http: HttpClient) {}

  getSessions(): Observable<Session[]> {
    return this.http.get<Session[]>('/api/v1/auth/sessions');
  }

  revokeSession(sessionId: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/auth/sessions/${sessionId}`);
  }

  logoutAll(): Observable<void> {
    return this.http.post<void>('/api/v1/auth/logout-all', {});
  }
}
```

### Security Actions

| Action | Behavior |
|---|---|
| Revoke session | Calls `DELETE /api/v1/auth/sessions/{sessionId}` via `SecurityService` and immediately removes the row from the `mat-table` data source on success |
| Log out all other sessions | Calls `POST /api/v1/auth/logout-all` via `SecurityService`, preserves the current session, and invalidates every other refresh session |
| Resend verification email | Available when `user.email_verified_at` is null; triggers the auth resend-verification flow via `AuthService` |

If the current session is revoked from another browser or by an administrator, the page receives the normal session-expired flow described in Module 8 and returns the user to the login screen without flashing protected content.

## API Integration

| Action | Service Method | Endpoint |
|---|---|---|
| Load notification preferences | `PreferencesService.getPreferences()` | `GET /api/v1/notification-preferences` |
| Save notification preferences | `PreferencesService.updatePreferences()` | `PUT /api/v1/notification-preferences` |
| Load sessions | `SecurityService.getSessions()` | `GET /api/v1/auth/sessions` |
| Revoke session | `SecurityService.revokeSession()` | `DELETE /api/v1/auth/sessions/{sessionId}` |
| Log out all other sessions | `SecurityService.logoutAll()` | `POST /api/v1/auth/logout-all` |
| Resend verification | `AuthService.resendVerification()` | `POST /api/v1/auth/email-verification/resend` |

## Accessibility & Resilience

- Toggle groups use `mat-slide-toggle` within Angular Material `mat-list` with accessible labels via `aria-label`.
- Session revoke buttons include device details in their accessible names via `[attr.aria-label]`.
- Save and revoke actions expose progress state via `mat-spinner` and disable duplicate submission with `[disabled]="submitting()"`.
- Both screens render skeleton placeholders (`mat-progress-bar`) during initial load and inline retry affordances (`mat-button`) on recoverable failures.

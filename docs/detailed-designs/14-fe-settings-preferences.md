# Module 14: Frontend - Settings & Preferences

**Requirements**: L1-1, L1-6, L1-10, L2-1.4, L2-6.5, L2-10.1, L2-10.3

**Backend APIs**: [01-authentication.md](01-authentication.md), [06-notifications.md](06-notifications.md)

## Overview

The settings area closes the previous gap between routed navigation and actual design coverage. It contains two authenticated screens:

- `PreferencesPage` at `/settings/preferences`
- `SecurityPage` at `/settings/security`

Both screens use the shared app shell, share the responsive breakpoints defined in Module 7, and follow the same loading, empty, success, and error-state rules as the rest of the SPA.

## Screen Responsibilities

| Screen | Purpose |
|---|---|
| `PreferencesPage` | Manage email notification preferences by category while keeping in-app notifications enabled |
| `SecurityPage` | View active sessions, revoke a specific session, log out all other sessions, and review key account-security state such as email verification and last password change |

## Preferences Page

### Layout

- Desktop: two-column content area with a preference form card and a help/status card
- Tablet: stacked cards with inline save status
- Mobile: single-column layout with full-width toggles and sticky save bar

### Notification Preference Categories

| Preference key | Label | Default |
|---|---|---|
| `payment_due_email` | Payment due reminders | Enabled |
| `payment_overdue_email` | Overdue payment alerts | Enabled |
| `payment_received_email` | Payment received confirmations | Enabled |
| `schedule_changed_email` | Schedule change updates | Enabled |
| `loan_modified_email` | Loan term change updates | Enabled |
| `system_email` | System notices | Disabled |

### UX Rules

- In-app notifications are always on for supported events and are not toggleable.
- Toggle changes update a dirty-state banner and enable the primary `Save preferences` action.
- A successful save updates local query cache and shows a non-blocking success toast.
- Recoverable save failures keep form state intact and render inline error messaging.

## Security Page

### Session Inventory

Each active session row shows:

- device or user-agent summary
- IP-derived geo hint when available
- created time
- last used time
- current-session badge
- revoke action

### Security Actions

| Action | Behavior |
|---|---|
| Revoke session | Calls `DELETE /api/v1/auth/sessions/{sessionId}` and immediately removes the row on success |
| Log out all other sessions | Calls `POST /api/v1/auth/logout-all`, preserves the current session, and invalidates every other refresh session |
| Resend verification email | Available when `user.email_verified_at` is null; triggers the auth resend-verification flow |

If the current session is revoked from another browser or by an administrator, the page receives the normal session-expired flow described in Module 8 and returns the user to the login screen without flashing protected content.

## API Integration

| Action | Hook | Endpoint |
|---|---|---|
| Load notification preferences | `useNotificationPreferences` | `GET /api/v1/notification-preferences` |
| Save notification preferences | `useUpdateNotificationPreferences` | `PUT /api/v1/notification-preferences` |
| Load sessions | `useSessions` | `GET /api/v1/auth/sessions` |
| Revoke session | `useRevokeSession` | `DELETE /api/v1/auth/sessions/{sessionId}` |
| Log out all other sessions | `useLogoutAllSessions` | `POST /api/v1/auth/logout-all` |
| Resend verification | `useResendVerification` | `POST /api/v1/auth/email-verification/resend` |

## Accessibility & Resilience

- Toggle groups use fieldsets and accessible labels.
- Session revoke buttons include device details in their accessible names.
- Save and revoke actions expose progress state and disable duplicate submission.
- Both screens render skeletons during initial load and inline retry affordances on recoverable failures.

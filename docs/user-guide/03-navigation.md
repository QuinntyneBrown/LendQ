# Navigation and Layout

LendQ adapts its layout to three screen sizes. This page describes what you see where.

## Desktop (≥ 1280 px wide)

![Desktop layout](screenshots/05-layout-desktop.png)

A fixed **sidebar** on the left, a sticky **header** with the notification bell on the right, and the main content in between.

### Sidebar

From top to bottom:

- **Logo / brand** — click to go to the dashboard.
- **Primary navigation** — Dashboard, My Loans / Borrowings, Recurring Loans, Account, Savings, Notifications, Settings.
- **Admin-only navigation** — Users, Bank Accounts (only shown when your account has the `Admin` role).
- **User tile (footer)** — your avatar, full name, and email. Click to open a menu with **Sign out**.

The currently active page is highlighted. Each item shows a small icon to the left of the label.

### Header

A thin sticky bar across the top of the content area. On the right side:

- **Notification bell** — shows an unread-count badge. Click to open the notification dropdown.

### Main content

The rest of the viewport. Each page title appears at the top of the content area, often with action buttons on the right (for example, a **Create New Loan** button on the Loans list).

## Tablet (768 – 1279 px wide)

The sidebar collapses into a **hamburger drawer**. Tap the hamburger in the top-left to open it; tap outside or on a link to close it.

The desktop notification bell remains in the header.

## Mobile (< 768 px wide)

![Mobile layout](screenshots/06-layout-mobile.png)

- **Top bar** — logo and user avatar (click to open the account menu).
- **Main content** — full-width pages with stacked cards and sticky action buttons.
- **Bottom navigation** — five primary tabs always visible:
  - **Home** (`layout-dashboard` icon) — the dashboard.
  - **Loans** (`banknote` icon) — loans where you are the creditor.
  - **Owed** (`hand-coins` icon) — loans where you are the borrower.
  - **Alerts** (`bell` icon) — notifications list.
  - **More** (`menu` icon) — expands the full menu.
- **More menu** reveals the less-frequent destinations: Savings, Recurring Loans, Account, Settings, and (for Admins) Users and Bank Accounts, plus **Sign out**.

> The desktop sidebar uses the full "My Loans" / "Borrowings" / "Savings" / "Notifications" labels; the mobile bar uses shorter forms to fit. Both point at the same pages.

## The notification bell

Click the bell to open a dropdown with your most recent unread notifications.

- **Click a notification** → marks it read and navigates to the related loan (or other object).
- **View all** link at the bottom → opens the full [Notifications](09-notifications.md) list page.
- Unread counts refresh on page load and whenever a new notification arrives over the server-sent events (SSE) stream.

## Route reference

| Path | Page | Access |
|---|---|---|
| `/login` | Sign in | Public |
| `/signup` | Sign up | Public |
| `/forgot-password` | Request reset link | Public |
| `/reset-password/:token` | Set new password | Public |
| `/dashboard` | [Dashboard](02-dashboard.md) | Authenticated |
| `/loans` | [Loans list](04-loans.md#loans-list) | Authenticated |
| `/loans/:id` | [Loan detail](04-loans.md#loan-detail-page) | Authenticated |
| `/loans/recurring` | [Recurring loans list](06-recurring-loans.md) | Authenticated |
| `/loans/recurring/:id` | Recurring loan detail | Authenticated |
| `/account` | [Bank account](07-bank-account.md) | Authenticated |
| `/savings` | [Savings goals list](08-savings-goals.md) | Authenticated |
| `/savings/:id` | Savings goal detail | Authenticated |
| `/notifications` | [Notifications list](09-notifications.md) | Authenticated |
| `/settings` | [Settings](10-settings.md) | Authenticated |
| `/users` | [User management](11-admin-users.md) | **Admin only** |
| `/users/roles` | [Role management](12-admin-roles.md) | **Admin only** |
| `/admin/accounts` | [Admin bank accounts](13-admin-bank-accounts.md) | **Admin only** |
| `/admin/accounts/:id` | Admin bank account detail | **Admin only** |

Any unknown path redirects to `/dashboard`. Any protected path without a session redirects to `/login` and remembers where you were trying to go.

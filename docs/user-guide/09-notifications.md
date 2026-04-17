# Notifications

**Route:** `/notifications`

LendQ generates notifications when things that matter to you happen — payments due, payments received, schedule changes, loan edits. Notifications appear in three places:

1. The **bell icon** in the top-right of the desktop header.
2. The **Notifications** list page.
3. **Toast** messages that slide in from the corner for live events while you are using the app.

![Notification bell dropdown](screenshots/18-notifications-bell.png)

## Notification types

| Type | Trigger |
|---|---|
| Payment Due | A scheduled payment is due soon (24h before due date by default). |
| Payment Overdue | A scheduled payment is past its due date. |
| Payment Received | The other party recorded a payment. |
| Schedule Changes | A payment was rescheduled or paused. |
| Loan Modified | Loan terms or metadata were edited. |

Each type can be toggled on or off individually — see [Preferences](#preferences).

## The bell icon (desktop header)

- **Badge** — shows unread count (capped at 99+). Hidden when zero.
- **Click the bell** — opens a dropdown of the most recent unread notifications.
- **Click a notification** — marks it read and navigates to the related object (loan, payment, savings goal).
- **View All** — opens the full list page.

The badge updates in real time via a server-sent events (SSE) stream. No page refresh needed.

## Notifications list page

![Notifications list](screenshots/19-notifications-list.png)

The full list page shows all your notifications, grouped by date.

### Filter tabs

Along the top:

- **All** (default)
- **Payments**
- **Overdue**
- **Schedule Changes**
- **System**

### Date groups

Items are grouped into:

- **Today**
- **Yesterday**
- **Earlier**

### Per-notification display

Each item shows:

- An **icon** for the notification type.
- A **title** and **message**.
- A **visual read/unread indicator** (unread items have a small dot and bolder text).
- Relative timestamp ("2 hours ago").

### Actions

- **Click** a notification — marks it read and navigates to the related object.
- **Mark all as read** — link in the top-right of the page.
- **Pagination** — at the bottom.

## Toast messages

When something happens while you are actively using the app, a small colored notification ("toast") slides in from the corner and disappears after a few seconds. Toasts do not replace notifications — they are an instant heads-up. Missed toasts are still in the list page and the bell dropdown.

Colors:

- Green — success (e.g. "Payment recorded").
- Red — error (e.g. "Failed to create loan").
- Yellow — warning.
- Blue — info.

You cannot dismiss a toast manually; they auto-close after 5 seconds.

## Preferences

Notification preferences live under [Settings](10-settings.md).

1. Open the sidebar and click **Settings**.
2. Scroll to **Notification Preferences**.
3. Toggle each type on or off:
   - Payment Due
   - Payment Overdue
   - Payment Received
   - Schedule Changes
   - Loan Modified
4. Changes save instantly — no separate **Save** button.

![Notification preferences](screenshots/20-notifications-preferences.png)

Turning a type off only affects **future** notifications — existing unread items remain until you mark them read.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Badge never updates | SSE connection was blocked by a proxy / firewall | Refresh the page. Long-poll fallback will retrigger. |
| Notifications arrive in email but not the bell | You are signed in to a different account in the browser | Sign out and back in as the notified user. |
| Clicking a notification takes me to the dashboard | The related object was deleted | The link fell back to the dashboard. Check the audit log. |
| I turned off "Payment Due" but still get emails | Preferences apply to in-app notifications only — email preferences are separate (if email is enabled in your environment) | Contact the admin to adjust email templates; in-app toggles don't control email. |

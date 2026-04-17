# Settings

**Route:** `/settings`

The Settings page is where you manage personal preferences. Today it is focused on notification toggles and session management; more sections will appear over time.

Click **Settings** in the sidebar (desktop) or **More → Settings** (mobile).

![Settings page](screenshots/21-settings.png)

## Notification Preferences

The main section. Toggle each in-app notification type:

- **Payment Due**
- **Payment Overdue**
- **Payment Received**
- **Schedule Changes**
- **Loan Modified**

Toggles save the moment you flip them — there is no separate Save button. A small check animation confirms success. If the save fails, a red error toast shows and the toggle reverts.

See [Notifications › Preferences](09-notifications.md#preferences) for what each type does.

## Account details (read-only)

Shown for reference:

- Full name
- Email
- Roles
- Member since (account creation date)

Changing your display name or email is currently done by an administrator — see [User Management](11-admin-users.md). Password change is via the **Forgot Password** flow from the [sign-in page](01-getting-started.md#5-forgot-your-password).

## Session management

A list of active sessions across your devices. Each entry shows:

- Device / browser description
- IP address (if configured to display)
- Last active timestamp
- A **Sign out** button to terminate just that session.

There is also a **Sign out everywhere** button that terminates every session on every device, including the one you are currently using. Use this if you lost a device or suspect someone else gained access.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Toggle doesn't save | Network error | Red toast appears and toggle reverts. Check your connection and retry. |
| "Sign out everywhere" didn't sign out the current session | Your access token hadn't expired yet — refresh is what gets rejected | Refresh the page; you'll be kicked to the sign-in screen. |
| I don't see the Sessions list | Feature is disabled in your deployment | Ask an administrator — it is controlled by a backend config flag. |

# User Management (Admin)

**Route:** `/users`

> **Admin only.** Non-admin users redirected to the dashboard.

The Users page is the admin's hub for creating, editing, disabling, and deleting accounts.

## Users list

![User list page](screenshots/22-users-list.png)

Columns:

- **Name**
- **Email**
- **Roles** (chips)
- **Status** — Active or Inactive
- **Created** date

Row actions:

- **Edit** (pencil icon) — opens the Add/Edit dialog.
- **Delete** (trash icon) — opens the confirmation dialog.

Other controls:

- **Search** — live filter over name and email.
- **Sortable columns** — click a column header to toggle asc/desc.
- **Pagination** — at the bottom.
- **Add User** button (top-right).

On mobile, the table collapses into cards.

## Add a user

1. Click **Add User**.
2. Fill in:
   - **Full Name**
   - **Email Address** (must be unique)
   - **Password** — required for new accounts. Minimum 8 characters.
   - **Roles** — check one or more (e.g. Borrower, Creditor, Admin).
   - **Active** toggle — leave ON unless provisioning an account you want blocked at creation.
3. Click **Save User**.

![Add/edit user dialog](screenshots/23-user-dialog.png)

If the email already exists in the system, you'll see a `409 Conflict` error inline.

## Edit a user

1. Click the pencil icon on the user's row.
2. Update any of:
   - Full Name
   - Email
   - Password (leaving blank keeps the current password)
   - Roles
   - Active status
3. Click **Save User**.

Changing a user's roles takes effect immediately on their next request. If they are currently signed in, they may see access denied on a formerly-allowed admin page until they reload.

## Deactivate vs. Delete

LendQ prefers **deactivation** over deletion.

- **Deactivate** (uncheck **Active**) — the user can no longer sign in, but their historical data (loans, payments, notifications) remains linked.
- **Delete** — removes the user row and unlinks them from loans. Use only when the account was created in error and has no history.

## Delete a user

1. Click the trash icon on the row.
2. A confirmation dialog shows the user's name.
3. Click **Delete User**.

The user cannot be recovered. If they had loans, the loans remain but the borrower/creditor name on those loans becomes "Deleted user" — historical audit trails are preserved.

## Password reset (admin-initiated)

Admins can trigger a password reset from the Users detail view:

1. Open the edit dialog.
2. Click **Send Reset Link**.
3. The user receives the same reset email as the self-service [Forgot Password](01-getting-started.md#5-forgot-your-password) flow.

For direct admin password reset (setting a new password without email), use the API endpoint `POST /api/v1/admin/users/:id/password` — this is currently CLI/API only.

## Common admin tasks

### Promote a borrower to creditor

1. Open their user row → **Edit**.
2. Check **Creditor** (keep **Borrower** if they also borrow).
3. Save.

### Disable a former user

1. Open their row → **Edit**.
2. Toggle **Active** off.
3. Save.

### Fix a typo'd email

1. Open their row → **Edit**.
2. Update email.
3. Save.

The user will need to use the new email at the next sign-in. Any pending password-reset links tied to the old email are invalidated.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| "Email already in use" error | Duplicate | Check the Users list for the existing account, or use a different email. |
| "Password must be at least 8 characters" | Weak password | Longer password. |
| "You are not authorized" error on `/users` | Your account doesn't have the `Admin` role | Ask another admin to grant it. |
| User can still sign in after I deactivated them | Their access token is still valid until it expires (short-lived JWTs) | Use **Sign out everywhere** via an admin endpoint, or wait for the token to expire. |

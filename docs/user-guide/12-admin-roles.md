# Role Management (Admin)

**Route:** `/users/roles`

> **Admin only.**

Roles collect permissions. Users can hold one or more roles, and the union of permissions determines what they can do. This page is where an Admin tunes which permissions each role includes.

## Role list

![Role management page](screenshots/24-roles-list.png)

The page shows a grid of role cards:

- 1 column on mobile
- 3 columns on desktop

Each card has:

- **Role name** (e.g. `Admin`, `Creditor`, `Borrower`)
- **Description**
- **Permission chips** — a list of permissions currently granted to this role.
- **Edit** (pencil icon) in the top-right.

## Built-in roles

LendQ ships with three baseline roles:

| Role | Summary |
|---|---|
| **Admin** | All platform permissions — user management, role management, bank account provisioning, audit access. |
| **Creditor** | Can create and manage loans, record payments on their own loans, view borrower summaries. |
| **Borrower** | Can view their own loans, record payments against them, manage their bank account and savings goals. |

You can add or remove specific permissions from any of these, and you can create custom roles if your deployment enables it.

## Edit a role's permissions

1. Click the pencil icon on the role card.
2. The **Permission Editor** opens:
   - **Role name** (read-only for built-ins).
   - **Description** (editable).
   - **Permission checkboxes** — grouped by domain (loans, payments, users, admin, bank accounts, savings).
3. Check or uncheck permissions.
4. Click **Save**.

![Role permission editor](screenshots/25-role-editor.png)

Changes take effect immediately. Users currently signed in with the role will see updated permissions on their next request.

## Permission model

Permissions follow a `domain.action` naming convention:

- `loans.create`, `loans.read`, `loans.update`
- `payments.record`, `payments.reschedule`, `payments.pause`
- `users.create`, `users.read`, `users.update`, `users.delete`
- `admin.bank_accounts.manage`
- `audit.read`

When the backend receives a request, it checks whether the user's roles collectively include the required permission for the endpoint. Missing permission returns `403 Forbidden`.

## Adding a custom role

If custom roles are enabled in your deployment:

1. Click **Create Role** (appears when the feature is on).
2. Name the role and write a description.
3. Check the permissions to include.
4. Save.

The new role appears in the grid and can be assigned via [User Management](11-admin-users.md).

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| "Role not found" when editing | Another admin deleted the role mid-edit | Reload the page. |
| User still can't access an admin page after I added Admin | Their access token is cached | Ask them to sign out and back in. |
| "Cannot edit built-in role name" | Built-in role names are read-only | You can change its permissions and description, not the name. |
| Unchecking a permission broke a user's flow | You removed a permission they need | Re-enable it and investigate what specific endpoint they were using in the backend logs. |

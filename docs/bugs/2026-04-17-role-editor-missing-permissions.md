---
id: 2026-04-17-role-editor-missing-permissions
title: Role Permission Editor is missing permissions that roles actually use
status: fixed
severity: medium
area: frontend
reported_by: claude
reported_at: 2026-04-17
fixed_at: 2026-04-17
fixed_in: frontend/src/users/RolePermissionEditor.tsx (added `loans:create`, `roles:write`, `payments:reschedule` to catalog)
---

## Summary

The Role Permission Editor on `/users/roles` renders a hardcoded list of 12 permission strings. Three permissions that the backend/seed actually assign to roles are **not** in that list: `loans:create` (Creditor), `roles:write` (Admin), and `payments:reschedule` (Borrower). An admin looking at this UI cannot see these permissions, cannot toggle them on, and could silently misunderstand what access each role has.

## Environment

- Environment: staging (`https://lemon-wave-0a1790b0f.6.azurestaticapps.net/`)
- Commit / version: `ve561dff`
- User role: Admin (`admin@lendq.local`)

## Steps to reproduce

1. Sign in as `admin@lendq.local`.
2. Navigate to `/users/roles`.
3. Click the pencil icon next to the **Creditor** role.
4. Scan the checkbox list. Notice there's no `loans:create` anywhere, even though the Creditor role card on the same page would include it if rendered from the API.

Verify via API:

```
GET /api/v1/roles
  Admin    → ["users:read","users:write","roles:write","loans:read","loans:write"]
  Creditor → ["loans:create","loans:read","loans:write","payments:write"]
  Borrower → ["loans:read","payments:read","payments:reschedule"]
```

Compare with `ALL_PERMISSIONS` in `frontend/src/users/RolePermissionEditor.tsx:8-21`: **`loans:create`, `roles:write`, and `payments:reschedule` are missing.**

## Expected behavior

The editor should list every permission that is actually usable by the backend. Ideally this catalog comes from an API endpoint (single source of truth). Minimum-viable fix: add the three missing permissions to the hardcoded array.

## Actual behavior

Three gaps:

1. **No way to add `loans:create` to a new or existing role** — it isn't in the checklist.
2. **`roles:write` (which controls the whole "admin can edit roles" capability) cannot be managed from this editor.**
3. **`payments:reschedule` (what lets borrowers request a reschedule) is invisible.**

The Save handler sends the current `selected` state — which *does* still include a role's pre-existing hidden permissions because `setSelected([...role.permissions])` is the initial seed. So hidden permissions survive round-tripping as long as nothing else disturbs them. But any admin who looked at this editor and made a reasonable assumption ("Creditor has exactly these permissions") would be wrong.

## Root cause analysis

`frontend/src/users/RolePermissionEditor.tsx:8-21`:

```ts
const ALL_PERMISSIONS = [
  "users:read",
  "users:write",
  "users:delete",
  "loans:read",
  "loans:write",
  "loans:delete",
  "payments:read",
  "payments:write",
  "payments:delete",
  "reports:read",
  "settings:read",
  "settings:write",
];
```

Hand-maintained list; drifted from backend reality.

## Suggested fix

Short term: add the three missing permissions to `ALL_PERMISSIONS`:

```ts
const ALL_PERMISSIONS = [
  "users:read", "users:write", "users:delete",
  "roles:write",
  "loans:read", "loans:write", "loans:delete", "loans:create",
  "payments:read", "payments:write", "payments:delete", "payments:reschedule",
  "reports:read",
  "settings:read", "settings:write",
];
```

Long term: expose a `GET /api/v1/roles/permissions` endpoint that returns the catalog, and fetch it in the editor. Removes the drift vector permanently.

## Impact and workaround

Medium. No data is actively lost today (the save handler preserves hidden permissions), but the UI misrepresents the current state and blocks admins from granting `loans:create` etc. to freshly-created roles.

Workaround: edit role permissions via the backend DB or a seed update.

## Related

- File: `frontend/src/users/RolePermissionEditor.tsx:8-21`
- Guide: `docs/user-guide/12-admin-roles.md#permission-model`
- Seed reference: `backend/app/seed.py:26-38`

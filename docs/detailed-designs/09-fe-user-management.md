# Module 9: Frontend - User Management & RBAC

**Requirements**: L1-2, L1-10, L2-2.1, L2-2.2, L2-2.3, L2-2.4, L2-2.5, L2-7.5

**Backend API**: [02-user-management.md](02-user-management.md)

## Overview

This feature provides the admin-only user list, add/edit dialog, role-permission editor, and audit search. It also exposes the shared borrower-directory picker used by the loan module.

## Class Diagram

![Class — User Management](diagrams/rendered/fe_class_user.png)

*Source: [diagrams/plantuml/fe_class_user.puml](diagrams/plantuml/fe_class_user.puml)*

## Screen Coverage

| Screen | Notes |
|---|---|
| `UserListPage` | Searchable and pageable user directory with responsive table/card layouts |
| `AddEditUserDialog` | Full-screen on mobile, centered modal on larger screens |
| `RoleManagementPage` | Controlled permission catalog editor, not free-form text |
| `AuditEventPanel` | Filter by actor, target, date range, and action type |

## API Integration

| Action | Endpoint |
|---|---|
| List users | `GET /api/v1/users` |
| Create user | `POST /api/v1/users` |
| Update user | `PATCH /api/v1/users/{id}` |
| List roles | `GET /api/v1/roles` |
| Update role permissions | `PUT /api/v1/roles/{roleKey}/permissions` |
| Search audit events | `GET /api/v1/admin/audit-events` |
| Search borrower directory | `GET /api/v1/users/borrowers?search=` |

## Sequence Diagram

![Sequence — User CRUD](diagrams/rendered/fe_seq_user_crud.png)

*Source: [diagrams/plantuml/fe_seq_user_crud.puml](diagrams/plantuml/fe_seq_user_crud.puml)*

## UX Rules

- When an admin deactivates a user or removes a privileged role, the success state explicitly states that active sessions were revoked.
- Role-permission editing is restricted to the canonical permission list returned by the API.
- Audit search supports deep links and persistent filter state because it is part of the operational accountability surface.

## Responsive And Accessibility Notes

- Desktop uses a data table; mobile uses cards with the same action coverage.
- Destructive actions require confirmation and name the affected user.
- Role chips, status badges, and action buttons include accessible names and keyboard focus support.

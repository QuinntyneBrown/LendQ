# Module 9: Frontend - User Management & RBAC (Blazor WebAssembly)

**Requirements**: L1-2, L1-10, L2-2.1, L2-2.2, L2-2.3, L2-2.4, L2-2.5, L2-7.5

**Backend API**: [02-user-management.md](02-user-management.md)

## Overview

This feature provides the admin-only user list, add/edit dialog, role-permission editor, and audit search as Blazor WebAssembly Razor components. It also exposes the shared borrower-directory picker component used by the loan module. All data access is through injectable services (`IUserService`, `IRoleService`, `IAuditService`) registered in the DI container.

## Class Diagram

![Class - User Management](diagrams/rendered/fe_class_user.png)

*Source: [diagrams/plantuml/fe_class_user.puml](diagrams/plantuml/fe_class_user.puml)*

## Screen Coverage

| Screen | Notes |
|---|---|
| `UserListPage.razor` (`@page "/users"`) | Searchable and pageable user directory with responsive table/card layouts. Uses `IUserService.GetUsersAsync()` with query parameters. Desktop renders a `DataTable.razor` component; mobile renders `UserCard.razor` items. |
| `AddEditUserDialog.razor` | Full-screen on mobile, centered modal on larger screens. Uses `EditForm` with `DataAnnotationsValidator` bound to a `UserFormModel`. Calls `IUserService.CreateUserAsync()` or `IUserService.UpdateUserAsync()` on valid submit. |
| `RoleManagementPage.razor` (`@page "/users/roles"`) | Controlled permission catalog editor, not free-form text. Loads roles via `IRoleService.GetRolesAsync()` and updates permissions via `IRoleService.UpdatePermissionsAsync()`. Permission toggles are bound to a `RolePermissionFormModel`. |
| `AuditEventPanel.razor` | Filter by actor, target, date range, and action type. Uses `IAuditService.SearchAuditEventsAsync()` with filter parameters bound to an `AuditFilterModel`. Date range inputs use native HTML date pickers with `DateTime` bindings. |

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

All API calls are made through typed service classes (`UserService`, `RoleService`, `AuditService`) that wrap `HttpClient` and return strongly-typed C# DTOs. These services are registered as scoped services in `Program.cs` and injected into page and component code via `@inject`.

## Sequence Diagram

![Sequence - User CRUD](diagrams/rendered/fe_seq_user_crud.png)

*Source: [diagrams/plantuml/fe_seq_user_crud.puml](diagrams/plantuml/fe_seq_user_crud.puml)*

## UX Rules

- When an admin deactivates a user or removes a privileged role, the success state explicitly states that active sessions were revoked. A confirmation modal (`ConfirmActionDialog.razor`) is shown before the destructive action, and the success message is displayed via a toast notification component.
- Role-permission editing is restricted to the canonical permission list returned by the API. The `RoleManagementPage.razor` renders checkboxes bound to the permission set; free-form input is not available.
- Audit search supports deep links via `NavigationManager` query string parsing (`[SupplyParameterFromQuery]` attribute) and persistent filter state, because it is part of the operational accountability surface.

## Responsive And Accessibility Notes

- Desktop uses a `DataTable.razor` component; mobile uses `UserCard.razor` components with the same action coverage. Layout switching is driven by Tailwind responsive breakpoints (`md:`, `lg:` prefixes).
- Destructive actions require confirmation via `ConfirmActionDialog.razor` and name the affected user in the dialog body.
- Role chips, status badges, and action buttons include accessible names (`aria-label`) and keyboard focus support (`@onkeydown` handlers, `tabindex` attributes). Focus is managed via JS interop when modals open and close.

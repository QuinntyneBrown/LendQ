# Module 9: Frontend - User Management & RBAC

**Requirements**: L1-2, L1-10, L2-2.1, L2-2.2, L2-2.3, L2-2.4, L2-2.5, L2-7.5

**Backend API**: [02-user-management.md](02-user-management.md)

## Overview

This feature provides the admin-only user list, add/edit dialog, role-permission editor, and audit search. It also exposes the shared borrower-directory picker used by the loan module. All components are Angular standalone components using Angular Material, Reactive Forms, and `@Injectable` services for API communication.

## Class Diagram

![Class - User Management](diagrams/rendered/fe_class_user.png)

*Source: [diagrams/plantuml/fe_class_user.puml](diagrams/plantuml/fe_class_user.puml)*

## Screen Coverage

| Screen | Notes |
|---|---|
| `UserListComponent` | Searchable and pageable user directory with `mat-table` on desktop and `mat-card` layouts on mobile |
| `AddEditUserDialogComponent` | `MatDialog` full-screen on mobile, centered modal on larger screens |
| `RoleManagementComponent` | Controlled permission catalog editor using `mat-checkbox` groups, not free-form text |
| `AuditEventPanelComponent` | Filter by actor, target, date range (`mat-datepicker`), and action type (`mat-select`) |

## UserService

`UserService` is an `@Injectable({ providedIn: 'root' })` service that wraps `HttpClient` calls:

```typescript
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly apiUrl = '/api/v1';

  constructor(private http: HttpClient) {}

  getUsers(params: UserListParams): Observable<PaginatedResponse<User>> {
    return this.http.get<PaginatedResponse<User>>(`${this.apiUrl}/users`, { params: toHttpParams(params) });
  }

  createUser(data: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users`, data);
  }

  updateUser(id: string, data: UpdateUserRequest): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/users/${id}`, data);
  }

  searchBorrowers(search: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/borrowers`, { params: { search } });
  }
}
```

## Add/Edit User Form

The `AddEditUserDialogComponent` uses Reactive Forms with validators:

```typescript
this.userForm = new FormGroup({
  email: new FormControl('', [Validators.required, Validators.email]),
  first_name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
  last_name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
  role: new FormControl('', [Validators.required]),
  is_active: new FormControl(true),
});
```

Material form fields (`mat-form-field`) display validation errors via `mat-error` with `*ngIf` bound to control error state.

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

![Sequence - User CRUD](diagrams/rendered/fe_seq_user_crud.png)

*Source: [diagrams/plantuml/fe_seq_user_crud.puml](diagrams/plantuml/fe_seq_user_crud.puml)*

## UX Rules

- When an admin deactivates a user or removes a privileged role, the success state explicitly states that active sessions were revoked.
- Role-permission editing is restricted to the canonical permission list returned by the API.
- Audit search supports deep links via Angular Router query params and persistent filter state because it is part of the operational accountability surface.

## Responsive And Accessibility Notes

- Desktop uses `mat-table` with `mat-sort` and `mat-paginator`; mobile uses `mat-card` layouts with the same action coverage.
- Destructive actions require confirmation via `MatDialog` and name the affected user.
- Role chips (`mat-chip-set`), status badges, and action buttons (`mat-icon-button`) include accessible names via `aria-label` and keyboard focus support through Angular Material's built-in a11y.

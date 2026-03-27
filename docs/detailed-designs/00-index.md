# LendQ — Backend Detailed Design Documentation

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Language | Python 3.11+ |
| Web Framework | Flask 3.x |
| ORM | SQLAlchemy 2.x |
| Database | PostgreSQL 15+ |
| Authentication | JWT (PyJWT) |
| Password Hashing | bcrypt |
| API Serialization | Marshmallow |
| Migration | Alembic |
| Testing | pytest |

## Architecture Overview

LendQ follows a layered architecture pattern:

- **Controller Layer** — Flask Blueprints exposing REST endpoints
- **Service Layer** — Business logic orchestration
- **Repository Layer** — Data access abstraction over SQLAlchemy
- **Entity/Model Layer** — SQLAlchemy ORM models

### C4 Context Diagram

![C4 Context](diagrams/rendered/c4_context.png)

### C4 Container Diagram

![C4 Container](diagrams/rendered/c4_container.png)

## Module Design Documents

| # | Module | Document |
|---|--------|----------|
| 1 | [Authentication](01-authentication.md) | Login, signup, password reset, JWT tokens |
| 2 | [User Management & RBAC](02-user-management.md) | User CRUD, roles, permissions |
| 3 | [Loan Management](03-loan-management.md) | Loan CRUD, creditor/borrower views |
| 4 | [Payment Tracking & Scheduling](04-payment-tracking.md) | Payments, rescheduling, pausing, history |
| 5 | [Dashboard](05-dashboard.md) | Summary metrics, active loans, activity feed |
| 6 | [Notifications](06-notifications.md) | In-app notifications, email alerts |

## Cross-Cutting Concerns

### API Conventions

All endpoints follow these conventions:

- Base URL: `/api/v1`
- Authentication: Bearer JWT in `Authorization` header
- Request/Response: `application/json`
- Pagination: `?page=1&per_page=20` returning `{items, total, page, per_page, pages}`
- Errors: `{error: string, code: string, details?: object}`
- HTTP Status Codes: 200 (OK), 201 (Created), 204 (No Content), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 409 (Conflict), 422 (Validation Error), 500 (Internal Server Error)

### Database Schema Conventions

- Primary keys: UUID v4 (`id` column)
- Timestamps: `created_at`, `updated_at` (UTC, auto-managed)
- Soft deletes: `is_active` boolean flag (no hard deletes on users)
- Foreign keys: `<entity>_id` naming convention
- Indexes: on all foreign keys and commonly filtered columns

### Error Handling

A global error handler catches exceptions and returns structured JSON:

```python
@app.errorhandler(Exception)
def handle_error(error):
    response = {"error": str(error), "code": error.__class__.__name__}
    return jsonify(response), getattr(error, 'status_code', 500)
```

Custom exception classes: `AuthenticationError(401)`, `AuthorizationError(403)`, `NotFoundError(404)`, `ConflictError(409)`, `ValidationError(422)`.

## Diagram Sources

- **PlantUML sources**: [`diagrams/plantuml/`](diagrams/plantuml/)
- **Draw.io sources**: [`diagrams/drawio/`](diagrams/drawio/) — open in [draw.io](https://app.diagrams.net) for editing
- **Rendered PNGs**: [`diagrams/rendered/`](diagrams/rendered/)
- **Render scripts**: [`diagrams/render_plantuml.py`](diagrams/render_plantuml.py)

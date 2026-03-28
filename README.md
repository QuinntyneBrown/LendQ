# LendQ

LendQ is a lending management platform for tracking private, family, and small-circle loans with structured workflows for authentication, role-based access control, loan governance, payment tracking, dashboards, notifications, and auditability.

This repository contains the application stack plus supporting project assets:

- an ASP.NET Core backend API in [`backend/`](./backend)
- an Angular + TypeScript frontend SPA in [`frontend/`](./frontend)
- a Playwright end-to-end suite in [`e2e/`](./e2e)
- supporting requirements, architecture docs, UI assets, and the OpenAPI contract in [`docs/`](./docs)
- local development infrastructure in [`ops/`](./ops)

![LendQ documented container architecture](docs/detailed-designs/diagrams/rendered/c4_container.png)

## Contents

- [Project Status](#project-status)
- [Feature Coverage](#feature-coverage)
- [Technology Stack](#technology-stack)
- [Repository Layout](#repository-layout)
- [Quick Start](#quick-start)
- [Testing](#testing)
- [Current Integration Notes](#current-integration-notes)
- [Documentation Map](#documentation-map)
- [Contributing](#contributing)
- [License](#license)

## Project Status

LendQ is now a full-stack repository with implemented backend and frontend foundations, but it is still an actively aligning codebase rather than a fully polished production release.

### What exists today

| Area | Status | Notes |
| --- | --- | --- |
| Backend API | Implemented | ASP.NET Core Web API with controllers, services, repositories, EF Core models, migrations, seeding, health checks, and Hangfire wiring |
| Frontend SPA | Implemented | Angular app covering authentication, dashboard, loans, payments, users, notifications, and settings |
| Local dev infrastructure | Implemented | Docker Compose file for PostgreSQL, Redis, and Mailpit |
| API contract | Implemented | OpenAPI source of truth lives in [`docs/api/openapi.yaml`](./docs/api/openapi.yaml) |
| Requirements and architecture docs | Implemented | L1/L2 specs and detailed design modules live in [`docs/`](./docs) |
| Backend tests | Implemented | Unit, integration, and security coverage under [`backend/LendQ.Tests/`](./backend/LendQ.Tests) |
| End-to-end tests | Implemented | Playwright coverage for auth, dashboard, loans, payments, notifications, responsive states, accessibility, and security |
| Full frontend/backend contract alignment | In progress | Some frontend and E2E assumptions still target older auth and seed-data conventions |

## Feature Coverage

The codebase currently includes implementation across the main product domains:

- Authentication and sessions: login, signup, forgot/reset password, email verification, session listing, logout, logout-all, and session revocation
- User management and RBAC: user CRUD, role management, access control, and admin-facing flows
- Loan management: list, detail, create, update, terms versions, and borrower change-request workflows
- Payment tracking: schedule view, history, record payment, reschedule, and pause flows
- Dashboard: summary metrics, active loans, and activity feed
- Notifications: list, unread count, mark read, mark all read, notification preferences, and SSE stream endpoint
- Operations: migrations, seed data, health endpoints, request IDs, security headers, rate limiting, Redis/Hangfire dependencies, and observability scaffolding

The requirements and design baseline for these areas live in:

- [`docs/specs/L1.md`](./docs/specs/L1.md)
- [`docs/specs/L2.md`](./docs/specs/L2.md)
- [`docs/detailed-designs/00-index.md`](./docs/detailed-designs/00-index.md)

## Technology Stack

### Application stack

| Layer | Technology |
| --- | --- |
| Backend API | ASP.NET Core 8 Web API |
| ORM and migrations | Entity Framework Core 8, EF Core Migrations |
| Validation | FluentValidation |
| Serialization | System.Text.Json |
| Database | PostgreSQL |
| Background jobs | .NET BackgroundService, Hangfire |
| Frontend | Angular 18, TypeScript 5, Angular CLI |
| UI Library | Angular Material (Material Design 3) |
| Forms | Reactive Forms |
| Styling | Angular Material theme + SCSS |
| HTTP client | Angular HttpClient |
| E2E testing | Playwright |
| Contract governance | OpenAPI 3.1 |
| Design assets | Pencil `.pen`, PlantUML, draw.io |

### Local infrastructure

| Service | Port | Purpose |
| --- | --- | --- |
| Frontend | `4200` | Angular dev server |
| Backend API | `5001` | ASP.NET Core API (HTTPS) |
| PostgreSQL | `5432` | Primary database |
| Redis | `6379` | Rate limiting, broker/backend infrastructure |
| Mailpit SMTP | `1025` | Local mail capture SMTP |
| Mailpit UI | `8025` | Browser mail inbox |

## Repository Layout

```text
LendQ/
|-- backend/
|   |-- LendQ.Api/
|   |-- LendQ.Core/
|   |-- LendQ.Application/
|   |-- LendQ.Infrastructure/
|   |-- LendQ.Tests/
|   `-- LendQ.sln
|-- frontend/
|   |-- src/
|   |-- angular.json
|   |-- package.json
|   `-- tsconfig.json
|-- e2e/
|   |-- tests/
|   |-- fixtures/
|   |-- pages/
|   `-- playwright.config.ts
|-- docs/
|   |-- api/openapi.yaml
|   |-- specs/
|   |-- detailed-designs/
|   `-- ui-design.pen
|-- ops/
|   `-- docker-compose.dev.yml
|-- CONTRIBUTING.md
|-- LICENSE
`-- README.md
```

## Quick Start

### Prerequisites

- .NET 8 SDK
- Node.js 20+
- npm
- Docker Desktop

### 1. Start local infrastructure

```bash
docker compose -f ops/docker-compose.dev.yml up -d
```

This starts PostgreSQL, Redis, and Mailpit.

### 2. Restore backend dependencies and build

From the repository root:

```bash
dotnet restore backend/LendQ.sln
dotnet build backend/LendQ.sln
```

### 3. Run database migrations

```bash
dotnet ef database update --project backend/LendQ.Infrastructure --startup-project backend/LendQ.Api
```

### 4. Seed demo data

```bash
dotnet run --project backend/LendQ.Api -- --seed demo
```

Demo accounts created by the seed script:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@lendq.local` | `admin123` |
| Creditor | `creditor@lendq.local` | `password123` |
| Borrower | `borrower1@lendq.local` | `password123` |
| Borrower | `borrower2@lendq.local` | `password123` |

### 5. Start the backend API

From the `backend/` directory:

```bash
dotnet run --project LendQ.Api
```

Useful endpoints:

- API base: `https://localhost:5001/api/v1`
- Liveness: `https://localhost:5001/health/live`
- Readiness: `https://localhost:5001/health/ready`

### 6. Start the frontend

From the repository root in a new terminal:

```bash
npm --prefix frontend install
npm --prefix frontend start
```

Or using the Angular CLI directly:

```bash
cd frontend
ng serve
```

The frontend runs at `http://localhost:4200`.

### 7. Inspect email traffic

Mailpit UI is available at `http://localhost:8025`.

It captures verification and password-reset emails sent by the backend.

## Testing

### Backend tests

From the repository root:

```bash
dotnet test backend/LendQ.sln
```

The backend test suite includes:

- unit tests under [`backend/LendQ.Tests/Unit/`](./backend/LendQ.Tests/Unit)
- integration tests under [`backend/LendQ.Tests/Integration/`](./backend/LendQ.Tests/Integration)
- security-focused tests under [`backend/LendQ.Tests/Security/`](./backend/LendQ.Tests/Security)

### Frontend tests

```bash
npm --prefix frontend test
```

Or using the Angular CLI:

```bash
cd frontend
ng test
```

### Frontend checks

```bash
npm --prefix frontend run lint
npm --prefix frontend run build
```

### Playwright end-to-end tests

```bash
npm --prefix e2e install
npm --prefix e2e exec playwright install
npm --prefix e2e run test
```

Useful variants:

```bash
npm --prefix e2e run test:headed
npm --prefix e2e run test:ui
npm --prefix e2e run test:chromium
npm --prefix e2e run test:tablet
npm --prefix e2e run test:mobile
```

## Current Integration Notes

The backend and frontend are implemented independently and communicate over HTTP. There are a few practical integration details worth knowing before you expect turnkey full-stack behavior:

- The Angular frontend makes API calls to `/api/v1`, while the ASP.NET Core backend runs on `https://localhost:5001`. CORS is configured in the backend's `Program.cs` to allow the Angular dev server origin (`http://localhost:4200`).
- For local development, the Angular CLI proxy is the recommended approach. A `proxy.conf.json` file in the `frontend/` directory forwards `/api` requests to the backend, avoiding CORS issues during development.
- The backend uses JWT Bearer authentication. The Angular `AuthService` stores the access token in memory and the `authInterceptor` attaches it to outgoing requests.
- The backend demo seed creates `@lendq.local` accounts, while the current Playwright fixtures may still reference older user conventions.

**Angular CLI proxy configuration** (`frontend/proxy.conf.json`):

```json
{
  "/api": {
    "target": "https://localhost:5001",
    "secure": false,
    "changeOrigin": true
  }
}
```

Start the Angular dev server with the proxy:

```bash
ng serve --proxy-config proxy.conf.json
```

Or configure the proxy in `angular.json` under the `serve` target's `options`:

```json
"options": {
  "proxyConfig": "proxy.conf.json"
}
```

Treat the repository as having implemented backend and frontend foundations, with some integration cleanup still needed between the live frontend, seeded backend data, and E2E fixtures.

## Documentation Map

Start here for the full system picture:

- [`docs/specs/L1.md`](./docs/specs/L1.md): high-level product and platform requirements
- [`docs/specs/L2.md`](./docs/specs/L2.md): detailed acceptance criteria
- [`docs/detailed-designs/00-index.md`](./docs/detailed-designs/00-index.md): architecture index and module map
- [`docs/api/openapi.yaml`](./docs/api/openapi.yaml): machine-readable API contract
- [`docs/local-development-workflow.md`](./docs/local-development-workflow.md): recommended local development conventions
- [`docs/repository-structure.md`](./docs/repository-structure.md): repository structure and traceability notes

Detailed design modules:

- [`docs/detailed-designs/01-authentication.md`](./docs/detailed-designs/01-authentication.md)
- [`docs/detailed-designs/02-user-management.md`](./docs/detailed-designs/02-user-management.md)
- [`docs/detailed-designs/03-loan-management.md`](./docs/detailed-designs/03-loan-management.md)
- [`docs/detailed-designs/04-payment-tracking.md`](./docs/detailed-designs/04-payment-tracking.md)
- [`docs/detailed-designs/05-dashboard.md`](./docs/detailed-designs/05-dashboard.md)
- [`docs/detailed-designs/06-notifications.md`](./docs/detailed-designs/06-notifications.md)
- [`docs/detailed-designs/07-fe-architecture.md`](./docs/detailed-designs/07-fe-architecture.md)
- [`docs/detailed-designs/08-fe-authentication.md`](./docs/detailed-designs/08-fe-authentication.md)
- [`docs/detailed-designs/09-fe-user-management.md`](./docs/detailed-designs/09-fe-user-management.md)
- [`docs/detailed-designs/10-fe-loan-management.md`](./docs/detailed-designs/10-fe-loan-management.md)
- [`docs/detailed-designs/11-fe-payment-tracking.md`](./docs/detailed-designs/11-fe-payment-tracking.md)
- [`docs/detailed-designs/12-fe-dashboard.md`](./docs/detailed-designs/12-fe-dashboard.md)
- [`docs/detailed-designs/13-fe-notifications.md`](./docs/detailed-designs/13-fe-notifications.md)
- [`docs/detailed-designs/14-fe-settings-preferences.md`](./docs/detailed-designs/14-fe-settings-preferences.md)
- [`docs/detailed-designs/15-security-session-architecture.md`](./docs/detailed-designs/15-security-session-architecture.md)
- [`docs/detailed-designs/16-operational-readiness-and-api-governance.md`](./docs/detailed-designs/16-operational-readiness-and-api-governance.md)

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to get started, submit pull requests, and report issues.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

# LendQ

[![Deploy to Staging](https://github.com/QuinntyneBrown/LendQ/actions/workflows/deploy-staging.yml/badge.svg)](https://github.com/QuinntyneBrown/LendQ/actions/workflows/deploy-staging.yml)

LendQ is a lending management platform for tracking private, family, and small-circle loans with structured workflows for authentication, role-based access control, loan governance, payment tracking, dashboards, notifications, and auditability.

This repository contains the application stack plus supporting project assets:

- a Flask backend API in [`backend/`](./backend)
- a React + TypeScript frontend SPA in [`frontend/`](./frontend)
- a Playwright end-to-end suite in [`e2e/`](./e2e)
- supporting requirements, architecture docs, UI assets, and the OpenAPI contract in [`docs/`](./docs)
- Azure infrastructure as code (Bicep) in [`ops/azure/`](./ops/azure)
- local development infrastructure in [`ops/`](./ops)

![LendQ documented container architecture](docs/detailed-designs/diagrams/rendered/c4_container.png)

## Contents

- [Project Status](#project-status)
- [Feature Coverage](#feature-coverage)
- [Technology Stack](#technology-stack)
- [Repository Layout](#repository-layout)
- [Quick Start](#quick-start)
- [Testing](#testing)
- [CI/CD and Deployment](#cicd-and-deployment)
- [Current Development Notes](#current-development-notes)
- [Documentation Map](#documentation-map)
- [Contributing](#contributing)
- [License](#license)

## Project Status

LendQ is an active full-stack repository with a working backend, frontend, seeded demo data, and end-to-end coverage. It is not a polished production release yet; the main remaining work is around auth-storage cleanup, async worker bootstrapping, and keeping older planning documents aligned with the implemented code.

### What exists today

| Area | Status | Notes |
| --- | --- | --- |
| Backend API | Implemented | Flask app factory, controllers, services, repositories, models, migrations, seeding, health checks, and Celery wiring |
| Frontend SPA | Implemented | Vite + React app covering authentication, dashboard, loans, payments, users, notifications, and settings |
| Local dev infrastructure | Implemented | Docker Compose file for PostgreSQL, Redis, and Mailpit |
| API contract | Implemented | OpenAPI source of truth lives in [`docs/api/openapi.yaml`](./docs/api/openapi.yaml) |
| Requirements and architecture docs | Implemented | L1/L2 specs and detailed design modules live in [`docs/`](./docs) |
| Backend tests | Implemented | Unit, integration, and security coverage under [`backend/tests/`](./backend/tests) |
| End-to-end tests | Implemented | Playwright coverage for auth, dashboard, loans, payments, notifications, responsive states, accessibility, and security |
| Frontend/backend operational alignment | In progress | Local proxying and seed-data alignment are in place, but auth storage and async worker startup still need cleanup |

## Feature Coverage

The codebase currently includes implementation across the main product domains:

- Authentication and sessions: login, signup, forgot/reset password, email verification, session listing, logout, logout-all, and session revocation
- User management and RBAC: user CRUD, role management, access control, and admin-facing flows
- Loan management: list, detail, create, update, terms versions, and borrower change-request workflows
- Payment tracking: schedule view, history, record payment, reschedule, and pause flows
- Dashboard: summary metrics, active loans, and activity feed
- Notifications: list, unread count, mark read, mark all read, notification preferences, and SSE stream endpoint
- Operations: migrations, seed data, health endpoints, request IDs, security headers, rate limiting, Redis/Celery dependencies, and observability scaffolding

The requirements and design baseline for these areas live in:

- [`docs/specs/L1.md`](./docs/specs/L1.md)
- [`docs/specs/L2.md`](./docs/specs/L2.md)
- [`docs/detailed-designs/00-index.md`](./docs/detailed-designs/00-index.md)

## Technology Stack

### Application stack

| Layer | Technology |
| --- | --- |
| Backend API | Flask 3 |
| ORM and migrations | SQLAlchemy, Flask-SQLAlchemy, Flask-Migrate |
| Validation and serialization | Marshmallow, Flask-Marshmallow |
| Database | PostgreSQL |
| Background jobs | Redis, Celery |
| Frontend | React 19, TypeScript, Vite 8 |
| Styling | Tailwind CSS |
| Client state and forms | TanStack Query, React Hook Form, Zod |
| HTTP client | Axios |
| E2E testing | Playwright |
| Contract governance | OpenAPI 3.1 |
| Design assets | Pencil `.pen`, PlantUML, draw.io |

### Local infrastructure

| Service | Port | Purpose |
| --- | --- | --- |
| Frontend | `5173` | Vite dev server |
| Backend API | `5000` | Flask API |
| PostgreSQL | `5432` | Primary database |
| Redis | `6379` | Rate limiting, broker/backend infrastructure |
| Mailpit SMTP | `1025` | Local mail capture SMTP |
| Mailpit UI | `8025` | Browser mail inbox |

## Repository Layout

```text
LendQ/
|-- backend/
|   |-- app/
|   |-- migrations/
|   |-- tests/
|   |-- pyproject.toml
|   `-- requirements-dev.txt
|-- frontend/
|   |-- src/
|   |-- package.json
|   `-- vite.config.ts
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
|   |-- azure/
|   |   |-- modules/
|   |   |-- main.bicep
|   |   |-- main.staging.bicepparam
|   |   |-- main.production.bicepparam
|   |   `-- github-secrets-setup.txt
|   `-- docker-compose.dev.yml
|-- CONTRIBUTING.md
|-- LICENSE
`-- README.md
```

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- npm
- Docker Desktop

### 1. Start local infrastructure

```bash
docker compose -f ops/docker-compose.dev.yml up -d
```

This starts PostgreSQL, Redis, and Mailpit.

### 2. Configure the backend and install Python dependencies

Create `backend/.env` from `backend/.env.example`, then create a virtual environment and install the backend dependencies.

Windows PowerShell:

```powershell
Copy-Item backend\.env.example backend\.env -Force
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r backend\requirements-dev.txt
```

macOS/Linux:

```bash
cp backend/.env.example backend/.env
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements-dev.txt
```

### 3. Install frontend dependencies

```bash
npm --prefix frontend install
```

### 4. Run database migrations

```bash
cd backend
python -m flask --app app:create_app db upgrade
```

### 5. Seed demo data

From the same `backend/` shell:

```bash
python -m app.seed --profile demo
```

The `demo` seed creates both the manual demo accounts used in the app and the `@family.com` accounts used by Playwright.

Primary demo accounts:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@lendq.local` | `admin123` |
| Creditor | `creditor@lendq.local` | `password123` |
| Borrower | `borrower1@lendq.local` | `password123` |
| Borrower | `borrower2@lendq.local` | `password123` |

Playwright fixture accounts:

- `admin@family.com` / `password123`
- `creditor@family.com` / `password123`
- `borrower@family.com` / `password123`

### 6. Start the backend API

From the `backend/` directory:

```bash
python -m flask --app app:create_app --debug run --host 0.0.0.0 --port 5000
```

Useful endpoints:

- API base: `http://localhost:5000/api/v1`
- Liveness: `http://localhost:5000/health/live`
- Readiness: `http://localhost:5000/health/ready`

### 7. Start the frontend

From the repository root in a new terminal:

```bash
npm --prefix frontend run dev
```

The frontend runs at `http://localhost:5173`. The checked-in Vite config already proxies `/api` to `http://localhost:5000` during local development.

### 8. Inspect email traffic

Mailpit UI is available at `http://localhost:8025`.

It captures verification and password-reset emails sent by the backend.

## Testing

### Backend quality checks

From the `backend/` directory with the virtual environment active:

```bash
ruff check .
ruff format --check .
pytest
```

The backend test suite includes:

- unit tests under [`backend/tests/unit/`](./backend/tests/unit)
- integration tests under [`backend/tests/integration/`](./backend/tests/integration)
- security-focused tests under [`backend/tests/security/`](./backend/tests/security)

### Frontend checks

```bash
npm --prefix frontend run lint
npm --prefix frontend run test
npm --prefix frontend run build
```

### Playwright end-to-end tests

With PostgreSQL, Redis, Mailpit, the backend, and the frontend running locally, and after applying the demo seed:

```bash
npm --prefix e2e install
npm --prefix e2e exec playwright install
npm --prefix e2e run test
```

Useful variants:

```bash
npm --prefix e2e run test:pr
npm --prefix e2e run test:smoke
npm --prefix e2e run test:changed
npm --prefix e2e run test:last-failed
npm --prefix e2e run test:responsive
npm --prefix e2e run test:cross-browser
npm --prefix e2e run test:full
npm --prefix e2e run test:headed
npm --prefix e2e run test:ui
npm --prefix e2e run test:debug
npm --prefix e2e run test:chromium
```

Recommended usage:

- `test` is the fast default local loop and runs `chromium-desktop`.
- `test:pr` mirrors the PR CI path: smoke plus responsive Chromium.
- `test:smoke` is the business-critical mutation-and-navigation path.
- `test:full` runs the reduced full regression across the kept browser and responsive projects.
- Use file-targeted and `--grep` Playwright commands for the tightest inner loop.

## CI/CD and Deployment

### GitHub Actions workflows

| Workflow | Trigger | Purpose |
| --- | --- | --- |
| **Deploy to Staging** (`deploy-staging.yml`) | Push to `main`, manual dispatch | Builds and deploys backend + frontend to the Azure staging environment |
| **E2E PR Fast Path** (`e2e-pr.yml`) | Pull request | Runs smoke + responsive E2E tests |
| **E2E Full Regression** (`e2e-full.yml`) | Daily at 06:00 UTC, manual dispatch | Runs full cross-browser E2E regression |

### Staging deployment pipeline

On every push to `main`, the staging deploy workflow runs two parallel jobs:

1. **deploy-api**: Builds the backend Docker image, pushes it to Azure Container Registry, runs database migrations via a Container Apps job, then updates the API, worker, and beat Container Apps. Finishes with an API health check.
2. **deploy-frontend**: Builds the Vite SPA and deploys it to Azure Static Web Apps.

### Azure staging environment

| Resource | Service | Name |
| --- | --- | --- |
| Frontend | Azure Static Web Apps | `swa-lendq-staging` |
| API | Azure Container Apps | `lendq-api-staging` |
| Worker | Azure Container Apps | `lendq-worker-staging` |
| Beat | Azure Container Apps | `lendq-beat-staging` |
| Migrations | Container Apps Job | `lendq-migrate-staging` |
| Database | PostgreSQL Flexible Server | `psql-lendq-staging` |
| Cache/Broker | Azure Cache for Redis | `redis-lendq-staging` |
| Container Registry | Azure Container Registry | `lendqacr` |
| Secrets | Azure Key Vault | `kv-lendq-staging` |
| Monitoring | Application Insights + Log Analytics | `ai-lendq-staging` |

Infrastructure is defined in Bicep under [`ops/azure/`](./ops/azure). See [`ops/azure/github-secrets-setup.txt`](./ops/azure/github-secrets-setup.txt) for the GitHub secrets required by the deploy workflow.

## Current Development Notes

A few repo-level details are worth knowing before you assume everything is production-ready:

- Local browser development already works through the checked-in proxy in [`frontend/vite.config.ts`](./frontend/vite.config.ts), so the SPA can call `/api/v1` while Flask runs on `http://localhost:5000`.
- `python -m app.seed --profile demo` creates both the `@lendq.local` demo accounts and the `@family.com` accounts used by the Playwright fixtures.
- The backend refresh flow is session/cookie-based, but the frontend still keeps the short-lived access token in `localStorage`, so auth storage is only partially aligned with the target design.
- Redis and Celery wiring exist in the backend, but [`ops/docker-compose.dev.yml`](./ops/docker-compose.dev.yml) currently boots only PostgreSQL, Redis, and Mailpit. Worker and beat processes are not part of the default local startup yet.
- Some planning documents, especially [`docs/local-development-workflow.md`](./docs/local-development-workflow.md), were written before implementation landed and are better read as architecture/convention guidance than exact current commands.

## Documentation Map

Start here for the full system picture:

- [`docs/specs/L1.md`](./docs/specs/L1.md): high-level product and platform requirements
- [`docs/specs/L2.md`](./docs/specs/L2.md): detailed acceptance criteria
- [`docs/detailed-designs/00-index.md`](./docs/detailed-designs/00-index.md): architecture index and module map
- [`docs/api/openapi.yaml`](./docs/api/openapi.yaml): machine-readable API contract
- [`docs/azure-cheapest-deployment.md`](./docs/azure-cheapest-deployment.md): recommended lowest-cost Azure deployment path and hosting choice
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

# LendQ

LendQ is a docs-first lending platform for managing private, family, and small-circle loans with stronger structure than a spreadsheet and less overhead than a traditional loan servicing system.

The product scope covers secure authentication, role-based access control, loan creation and governance, payment scheduling, immutable payment history, dashboards, notifications, responsive UX, and operational readiness.

This repository currently contains:

- a React + TypeScript frontend prototype in [`frontend/`](./frontend)
- a Playwright end-to-end test suite in [`e2e/`](./e2e)
- product requirements, architecture, API contract, and UI design assets in [`docs/`](./docs)

It does not yet contain the Flask/PostgreSQL backend implementation described in the architecture documents.

![LendQ documented container architecture](docs/detailed-designs/diagrams/rendered/c4_container.png)

## Contents

- [Project Status](#project-status)
- [Feature Coverage](#feature-coverage)
- [Technology Stack](#technology-stack)
- [Repository Layout](#repository-layout)
- [Getting Started](#getting-started)
- [Testing](#testing)
- [Documentation Map](#documentation-map)
- [Implementation Notes](#implementation-notes)
- [Contributing](#contributing)

## Project Status

LendQ is currently best understood as a hybrid of:

- an implemented frontend application shell
- a substantial Playwright acceptance suite
- a detailed architecture and API design package for the eventual full platform

### What exists today

| Area | Status | Notes |
| --- | --- | --- |
| Frontend SPA | Implemented | Vite + React app with authentication, dashboard, loans, payments, users, notifications, and settings flows |
| API contract | Implemented | OpenAPI source of truth lives in [`docs/api/openapi.yaml`](./docs/api/openapi.yaml) |
| Product requirements | Implemented | High-level and detailed requirements live in [`docs/specs/`](./docs/specs) |
| Architecture and design docs | Implemented | Detailed backend and frontend design modules live in [`docs/detailed-designs/`](./docs/detailed-designs) |
| UI design source | Implemented | Pencil design file lives in [`docs/ui-design.pen`](./docs/ui-design.pen) |
| End-to-end tests | Implemented | Playwright coverage for auth, dashboard, loans, payments, notifications, responsive states, accessibility, and security |
| Backend service code | Not in repository | Documented, but not yet committed under a `backend/` directory |
| Docker, CI, and root developer tooling | Not in repository | Referenced in design docs, but not present in the current tree |

## Feature Coverage

The frontend and test suite already reflect the main product domains:

- Authentication: sign in, sign up, forgot password, reset password, protected routes, logout, refresh-token handling
- Dashboard: summary cards, active loans, activity feed, loading and error states
- Loan management: creditor and borrower views, loan list, loan detail, create and edit flows
- Payment tracking: payment schedule, payment history, record payment, reschedule, pause
- User administration: user list, add/edit user, role management, deactivate/delete flows
- Notifications: bell, dropdown, list view, unread counts, preferences, toast messaging
- Responsive UX: desktop, tablet, and mobile navigation plus responsive forms, tables, dialogs, and dashboard layouts
- Quality gates: accessibility states, keyboard navigation, route protection, and session-handling scenarios

The detailed requirements trace to these areas in:

- [`docs/specs/L1.md`](./docs/specs/L1.md)
- [`docs/specs/L2.md`](./docs/specs/L2.md)
- [`docs/repository-structure.md`](./docs/repository-structure.md)

## Technology Stack

### Current repository stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 8 |
| Styling | Tailwind CSS |
| Data fetching | TanStack Query |
| Forms and validation | React Hook Form, Zod |
| HTTP client | Axios |
| Icons | Lucide React |
| E2E testing | Playwright |
| API contract | OpenAPI 3.1 |
| Design assets | Pencil `.pen`, PlantUML, draw.io |

### Target platform stack from the design docs

| Layer | Target technology |
| --- | --- |
| Web app | React SPA |
| API | Flask |
| Database | PostgreSQL |
| Async jobs | Redis + Celery workers/scheduler |
| Notifications | In-app + email |
| Contract governance | Versioned OpenAPI |

## Repository Layout

```text
LendQ/
|-- docs/
|   |-- api/openapi.yaml
|   |-- specs/L1.md
|   |-- specs/L2.md
|   |-- detailed-designs/
|   |-- local-development-workflow.md
|   |-- repository-structure.md
|   `-- ui-design.pen
|-- frontend/
|   |-- package.json
|   |-- vite.config.ts
|   `-- src/
|       |-- auth/
|       |-- dashboard/
|       |-- layout/
|       |-- loans/
|       |-- notifications/
|       |-- payments/
|       |-- settings/
|       |-- ui/
|       `-- users/
`-- e2e/
    |-- package.json
    |-- playwright.config.ts
    |-- fixtures/
    |-- helpers/
    |-- pages/
    `-- tests/
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+ or equivalent recent npm bundled with Node 20
- Playwright browser binaries if you plan to run the E2E suite

Optional for future full-stack work described in the docs:

- Python 3.11+
- Docker Desktop
- PostgreSQL tooling

### 1. Install frontend dependencies

```bash
npm --prefix frontend install
```

### 2. Start the frontend

```bash
npm --prefix frontend run dev
```

The frontend runs on `http://localhost:5173`.

### 3. Build or lint the frontend

```bash
npm --prefix frontend run build
npm --prefix frontend run lint
```

### Frontend-only usage

The app can be explored as a standalone frontend, but most screens issue live requests to `/api/v1`. Without a compatible backend or request stubbing, authenticated and data-backed flows will show error states.

## Testing

### Install E2E dependencies

```bash
npm --prefix e2e install
```

Install Playwright browsers:

```bash
npm --prefix e2e exec playwright install
```

### Run the test suite

```bash
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

### Important test assumptions

- The Playwright config targets `http://localhost:5173` by default.
- API helper utilities target `http://localhost:5000/api/v1` by default.
- Many tests assume seeded users and a compatible backend API are already available.
- A number of tests stub browser network traffic, but the full suite is not backend-free.

## Documentation Map

Start here if you want the full system picture:

- [`docs/specs/L1.md`](./docs/specs/L1.md): high-level business and platform requirements
- [`docs/specs/L2.md`](./docs/specs/L2.md): detailed acceptance criteria
- [`docs/detailed-designs/00-index.md`](./docs/detailed-designs/00-index.md): architecture index and module map
- [`docs/api/openapi.yaml`](./docs/api/openapi.yaml): machine-readable API contract
- [`docs/local-development-workflow.md`](./docs/local-development-workflow.md): recommended future full-stack local workflow
- [`docs/repository-structure.md`](./docs/repository-structure.md): target repository layout and requirement traceability
- [`docs/detailed-design-review.md`](./docs/detailed-design-review.md): design review notes

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

## Implementation Notes

These details are worth knowing before you start wiring new pieces into the repo:

- The frontend HTTP client currently uses a fixed same-origin base path of `/api/v1`.
- The current Vite config does not define a local proxy for `/api`.
- If you want a local backend on `http://localhost:5000`, you will need to add a Vite proxy or front both services with a reverse proxy.
- The design docs describe a stricter production session model than the current frontend prototype. The documented target uses secure cookie-based refresh sessions, while the present client stores tokens in `localStorage`.

Example Vite proxy if you want to wire the frontend to a local backend during development:

```ts
server: {
  port: 5173,
  proxy: {
    "/api": "http://localhost:5000",
  },
}
```

Treat the documentation as the target architecture and the committed frontend as the current implementation snapshot.

## Contributing

If you extend this repository, keep the contract between code and docs tight:

1. Update the OpenAPI file when API behavior changes.
2. Update the relevant L2 or detailed-design module when feature intent changes.
3. Keep frontend routes, API types, and Playwright coverage aligned.
4. Prefer documenting implementation gaps explicitly rather than letting the docs drift.

## License

No license file is currently present in this repository. Add one before treating the project as open source.

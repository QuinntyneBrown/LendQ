# Local Development

How to run LendQ end-to-end on your own machine. This is a condensed, task-oriented version of [Local Development Workflow](../local-development-workflow.md) — read that doc for the architectural rationale and deeper guidance.

## Prerequisites

- Python 3.11+
- Node.js 20 LTS
- Docker Desktop
- Git

## Clone and install

```bash
git clone https://github.com/QuinntyneBrown/LendQ.git
cd LendQ
```

### Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements-dev.txt
```

### Frontend

```bash
cd ../frontend
npm install
```

### E2E (optional)

```bash
cd ../e2e
npm install
npx playwright install
```

## Start infrastructure

```bash
cd ..
docker compose -f ops/docker-compose.dev.yml up -d postgres redis mailpit
```

This gives you:

- PostgreSQL on `localhost:5432` (user/pass `lendq`/`lendq`, db `lendq_dev`)
- Redis on `localhost:6379`
- Mailpit SMTP on `localhost:1025`, web UI at `http://localhost:8025`

## Configure env

Create `backend/.env`:

```env
FLASK_ENV=development
SECRET_KEY=dev-change-me
JWT_SECRET_KEY=dev-change-me
DATABASE_URL=postgresql+psycopg://lendq:lendq@localhost:5432/lendq_dev
REDIS_URL=redis://localhost:6379/0
MAIL_HOST=localhost
MAIL_PORT=1025
LOG_LEVEL=DEBUG
LOG_FORMAT=text
CORS_ORIGINS=http://localhost:5173
```

Create `frontend/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_ENABLE_QUERY_DEVTOOLS=true
```

## Run migrations

```bash
cd backend
python -m flask --app app:create_app db upgrade
```

## Seed data

```bash
python -m app.seed --profile baseline    # roles + one admin
python -m app.seed --profile demo        # adds sample users, loans, payments
```

The `demo` seed creates:

- Admin: `admin@lendq.test` / `Password123!`
- Creditor: `creditor@lendq.test` / `Password123!`
- Two borrowers: `borrower1@lendq.test`, `borrower2@lendq.test` / `Password123!`

## Start the API

```bash
python -m flask --app app:create_app run --debug --host 0.0.0.0 --port 5000
```

Or via `debugpy` for VS Code attach:

```bash
python -m debugpy --listen 5678 -m flask --app app:create_app run --debug --host 0.0.0.0 --port 5000
```

## Start the frontend

In a separate terminal:

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` — you should see the sign-in page. Sign in as `admin@lendq.test`.

## Run tests

### Backend

```bash
cd backend
python -m pytest
```

### Frontend

```bash
cd frontend
npm test
```

### E2E

The e2e suite expects both backend and frontend running.

```bash
cd e2e
npm run test            # chromium-desktop (fastest)
npm run test:smoke      # only @smoke-tagged
npm run test:pr         # smoke + responsive, the PR-equivalent run
npm run test:full       # full matrix across browsers (nightly)
```

Debug a single spec:

```bash
npx playwright test tests/loans/create-loan.spec.ts --project=chromium-desktop --headed
```

Or the UI runner:

```bash
npm run test:ui
```

## Typical daily loop

1. `docker compose -f ops/docker-compose.dev.yml up -d postgres redis mailpit`
2. Activate the Python venv.
3. `flask db upgrade` (only if migrations changed).
4. Start the API terminal.
5. Start the frontend terminal.
6. Edit code, see HMR, run tests in a third terminal.

## Useful commands

```bash
# Back up the dev database
docker compose -f ops/docker-compose.dev.yml exec -T postgres \
  pg_dump -U lendq lendq_dev > lendq_dev_backup.sql

# Restore
cat lendq_dev_backup.sql | docker compose -f ops/docker-compose.dev.yml exec -T postgres \
  psql -U lendq -d lendq_dev

# Tail API logs (if running in Docker)
docker compose -f ops/docker-compose.dev.yml logs -f api

# Tail frontend dev server — keep it in its own terminal
```

## Frontend code layout (for orientation)

```
frontend/src/
├── admin/bank-accounts/   — admin bank account views
├── api/                   — axios client, types, hooks
├── auth/                  — login, signup, forgot, reset, ProtectedRoute
├── bank-account/          — user-facing bank account
├── dashboard/             — DashboardPage and panels
├── layout/                — AppLayout, sidebars, bottom nav
├── loans/                 — list, detail, create/edit modal
├── notifications/         — bell, dropdown, list, toast provider
├── payments/              — record/reschedule/pause dialogs, schedule view
├── recurring-loans/       — list, detail, dialogs
├── savings/               — list, detail, create/edit, add funds
├── settings/              — SettingsPage
├── test/                  — shared test helpers (renderWithRouter)
├── ui/                    — Modal, Button, Input, Select, Loading, Error, etc.
├── users/                 — admin user list, role management, dialogs
├── utils/                 — formatters (currency, date)
├── App.tsx                — providers wrapper
├── main.tsx               — React entry
└── routes.tsx             — route table
```

## Backend code layout

```
backend/
├── app/
│   ├── controllers/       — Flask blueprints (one per domain)
│   ├── models/            — SQLAlchemy models
│   ├── services/          — business logic (stateless)
│   ├── schemas/           — Marshmallow request/response schemas
│   ├── repositories/      — data access
│   ├── errors/            — exception types & handlers
│   ├── config.py
│   ├── extensions.py
│   └── __init__.py        — create_app factory
├── migrations/            — Alembic migrations
├── tests/
│   ├── unit/              — model and service tests
│   ├── integration/       — endpoint tests (pytest-flask)
│   ├── security/          — role enforcement, security headers
│   ├── conftest.py
│   └── factories.py
├── pyproject.toml
└── requirements-dev.txt
```

## Troubleshooting the dev stack

See [Troubleshooting](16-troubleshooting.md) for an error-oriented list. Some dev-only issues:

| Symptom | Cause | Fix |
|---|---|---|
| `psycopg.OperationalError: connection refused` | Docker Postgres isn't up | `docker compose -f ops/docker-compose.dev.yml ps postgres`; start if needed. |
| Vite "port 5173 already in use" | Another dev server is running | `npx kill-port 5173` or use a different port. |
| Frontend shows CORS error | `CORS_ORIGINS` mismatch on backend | Set `CORS_ORIGINS=http://localhost:5173` in `backend/.env`. |
| JWT "signature verification failed" after restart | `JWT_SECRET_KEY` changed | Keep it stable across restarts, or sign out and back in. |
| SSE stream disconnects every few seconds | Vite proxy issue | Ensure `VITE_API_BASE_URL` points at port 5000 directly, not through a reverse proxy. |

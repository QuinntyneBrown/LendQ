# LendQ Local Development Workflow

## Scope

This repository currently contains design and architecture documentation, not an implementation. This document defines the **recommended** local development workflow for the planned LendQ stack described in:

- [`detailed-designs/00-index.md`](./detailed-designs/00-index.md)
- [`detailed-designs/07-fe-architecture.md`](./detailed-designs/07-fe-architecture.md)
- [`specs/L2.md`](./specs/L2.md)

Treat the commands, folders, and scripts below as the target conventions to standardize on when implementation begins.

## Planned Local Stack

| Service | Purpose | Recommended Local Mode | Default Port |
|---|---|---|---|
| Frontend SPA | React 18 + Vite UI | Run on host for fast HMR and browser debugging | `5173` |
| API | Flask 3 + SQLAlchemy backend | Run on host for Python breakpoints and reload | `5000` |
| PostgreSQL | System of record | Run in Docker with a named volume | `5432` |
| Queue Broker | Back async notifications and email jobs | Run in Docker if Celery is adopted | `6379` |
| Worker | Process async jobs | Run in Docker by default on Windows | none |
| Scheduler | Due-date scans and scheduled notifications | Run in Docker by default on Windows | none |
| Mail Capture | Inspect password-reset and notification emails | Run in Docker via Mailpit or MailHog | `1025`, `8025` |

## Recommended Topology

Use a hybrid local setup:

- Run `frontend` and `api` on the host machine for fast edit-refresh-debug loops.
- Run `postgres`, `redis`, and `mailpit` in Docker.
- Run `worker` and `scheduler` in Docker on Windows unless the async stack is known to work cleanly on the host.

This gives you fast application debugging without losing persistent infrastructure or email inspection.

## Opinionated Recommendation For Async Jobs

The current design docs leave the scheduled job implementation open between APScheduler and Celery. For local development and production parity, prefer:

- `Celery` for background jobs
- `Celery Beat` for scheduled notification scans
- `Redis` as the local broker

This better matches the reliability requirement for dedicated worker infrastructure in [`specs/L2.md`](./specs/L2.md) and avoids pushing scheduled work into the Flask web process.

## Prerequisites

Install these before starting implementation:

- Python `3.11+`
- Node.js `20 LTS`
- `npm` or `pnpm` and standardize on one package manager only
- Docker Desktop with Linux containers enabled
- VS Code
- A PostgreSQL client tool such as DBeaver, `psql`, or a VS Code PostgreSQL extension

If Windows is the primary host OS, prefer WSL2 for Docker-backed development even if the editor is VS Code on Windows.

## Recommended Repository Conventions

Adopt a layout close to this:

```text
backend/
  app/
  migrations/
  tests/
  requirements-dev.txt
frontend/
  src/
  package.json
ops/
  docker-compose.dev.yml
.vscode/
  launch.json
  tasks.json
```

Recommended process names:

- `api`
- `frontend`
- `postgres`
- `redis`
- `worker`
- `scheduler`
- `mailpit`

Using stable names makes logs, debugger profiles, and onboarding easier.

## Environment Configuration

Standardize on two local env files:

- `backend/.env`
- `frontend/.env.local`

Recommended backend variables:

```env
FLASK_ENV=development
SECRET_KEY=change-me
JWT_SECRET_KEY=change-me
DATABASE_URL=postgresql+psycopg://lendq:lendq@localhost:5432/lendq_dev
REDIS_URL=redis://localhost:6379/0
MAIL_HOST=localhost
MAIL_PORT=1025
LOG_LEVEL=DEBUG
LOG_FORMAT=json
CORS_ORIGINS=http://localhost:5173
```

Recommended frontend variables:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_ENABLE_QUERY_DEVTOOLS=true
```

Keep development secrets local only. Do not commit them.

## First-Time Setup

### 1. Start infrastructure

Use Docker Compose for persistence-oriented services first:

```powershell
docker compose -f ops/docker-compose.dev.yml up -d postgres redis mailpit
```

Recommended persistence section in `docker-compose.dev.yml`:

```yaml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: lendq
      POSTGRES_PASSWORD: lendq
      POSTGRES_DB: lendq_dev
    ports:
      - "5432:5432"
    volumes:
      - lendq_postgres_data:/var/lib/postgresql/data

volumes:
  lendq_postgres_data:
```

Important:

- Use a **named volume** for PostgreSQL.
- Do not rely on a container filesystem for database persistence.
- Do not run `docker compose down -v` unless you intentionally want to wipe local data.

### 2. Prepare the backend

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r backend\requirements-dev.txt
```

### 3. Prepare the frontend

```powershell
npm --prefix frontend install
```

If the project adopts `pnpm`, replace the examples and keep the whole repo consistent.

### 4. Apply database migrations

```powershell
.venv\Scripts\python -m flask --app app:create_app db upgrade
```

Migrations should be the only supported way to evolve the schema in local development.

### 5. Seed baseline data

```powershell
.venv\Scripts\python -m app.seed --profile baseline
```

### 6. Start the API

```powershell
.venv\Scripts\python -m debugpy --listen 5678 -m flask --app app:create_app run --debug --host 0.0.0.0 --port 5000
```

### 7. Start async processes

If Celery is adopted, prefer Docker-managed workers on Windows:

```powershell
docker compose -f ops/docker-compose.dev.yml up -d worker scheduler
```

If you need to debug the worker from VS Code, run one worker in a debuggable mode and attach to it instead of running it detached.

### 8. Start the frontend

```powershell
npm --prefix frontend run dev -- --host 0.0.0.0 --port 5173
```

### 9. Verify the platform

Confirm these endpoints and tools are reachable:

- Frontend: `http://localhost:5173`
- API base: `http://localhost:5000/api/v1`
- Mail UI: `http://localhost:8025`
- Health endpoints once implemented:
  - `http://localhost:5000/health/live`
  - `http://localhost:5000/health/ready`

## Daily Startup Workflow

For a normal development session:

1. Start Docker infrastructure: `postgres`, `redis`, `mailpit`.
2. Activate the Python virtual environment.
3. Run `db upgrade`.
4. Run the baseline seed if reference data changed.
5. Start `api`.
6. Start `worker` and `scheduler`.
7. Start `frontend`.
8. Open browser dev tools and mail capture before testing auth or notification flows.

## Viewing Logs

### Logging Principles

Prefer this logging model from the beginning:

- Log to `stdout` and `stderr`, not per-service local files.
- Use structured JSON logs for API, worker, and scheduler processes.
- Include a request or correlation ID in every API log line.
- Propagate that same ID into worker jobs triggered by the request when possible.
- Never log passwords, full tokens, reset tokens, or other raw secrets.

Recommended fields:

- `timestamp`
- `level`
- `service`
- `event`
- `request_id`
- `user_id`
- `route`
- `status_code`
- `duration_ms`
- `loan_id`
- `payment_id`

### Useful Log Commands

Infrastructure logs:

```powershell
docker compose -f ops/docker-compose.dev.yml logs -f postgres
docker compose -f ops/docker-compose.dev.yml logs -f redis
docker compose -f ops/docker-compose.dev.yml logs -f mailpit
```

If API and frontend run on the host, keep them in dedicated terminals so logs stay visible. If the API is containerized later:

```powershell
docker compose -f ops/docker-compose.dev.yml logs -f api
docker compose -f ops/docker-compose.dev.yml logs -f worker
docker compose -f ops/docker-compose.dev.yml logs -f scheduler
```

### Log-Viewing Techniques

- Keep one terminal dedicated to `api` logs and one for `worker` logs.
- Use browser Network tools with `Preserve log` enabled while watching backend logs.
- Correlate requests by `request_id` rather than by timestamp alone.
- When debugging a noisy flow, prefer VS Code logpoints or conditional logs instead of adding permanent `print()` statements.
- Enable SQLAlchemy SQL echo only temporarily, because full SQL logging gets noisy fast.
- For notification and email issues, inspect both the `worker` logs and the Mailpit web UI together.

## Breakpoints And Interactive Debugging

### Backend Breakpoints

Run the Flask API under `debugpy` and attach VS Code. Use breakpoints at:

- route entry for malformed payloads or auth issues
- service-layer methods for business logic
- repository methods for unexpected query behavior
- serializer or schema validation for `422` responses

Useful breakpoint techniques:

- Conditional breakpoints on a specific `loan_id`, `payment_id`, or email
- Exception breakpoints for uncaught exceptions
- Temporary logpoints on high-frequency routes
- Watch expressions for current user, roles, request payload, and SQLAlchemy model state

Do not leave broad `echo=True` or permanent debug prints enabled after the issue is understood.

### Frontend Breakpoints

Debug the Vite app with browser dev tools or VS Code `pwa-chrome` debugging. Set breakpoints in:

- route guards
- TanStack Query query and mutation handlers
- auth bootstrap and token refresh logic
- modal submit handlers
- table filters and search state

Useful frontend techniques:

- Use browser Network tools to compare request payloads with backend expectations.
- Add temporary `debugger` statements only for isolated flows and remove them before commit.
- Use React Developer Tools to inspect component props and state.
- Enable TanStack Query Devtools in development to inspect cache entries, query status, invalidations, and retries.

### Worker And Scheduler Breakpoints

Background work is harder to debug because it is not tied to a browser request. Use this pattern:

1. Trigger the job from the app or from a seed helper.
2. Run a single worker in debug mode.
3. Attach VS Code to that worker process.
4. Re-run the action and inspect the job payload end-to-end.

If the project stays on Windows, prefer debugging workers inside Docker or WSL2 rather than relying on unsupported host-native process models.

### Suggested VS Code Launch Configurations

Add a `.vscode/launch.json` similar to this once the codebase exists:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "LendQ API",
      "type": "python",
      "request": "launch",
      "module": "flask",
      "env": {
        "FLASK_APP": "app:create_app",
        "FLASK_ENV": "development"
      },
      "args": ["run", "--debug", "--port", "5000"],
      "jinja": true,
      "justMyCode": false
    },
    {
      "name": "LendQ Frontend",
      "type": "pwa-chrome",
      "request": "launch",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/frontend/src"
    },
    {
      "name": "Attach API (debugpy)",
      "type": "python",
      "request": "attach",
      "connect": {
        "host": "localhost",
        "port": 5678
      },
      "justMyCode": false
    }
  ]
}
```

## Database Persistence Across Development Sessions

The local dev database should survive machine restarts, container restarts, and normal `docker compose down`.

Use these rules:

- Persist PostgreSQL with a named Docker volume such as `lendq_postgres_data`.
- Keep a dedicated `lendq_dev` database for local development.
- Keep `lendq_test` separate and disposable.
- Never point tests at the persistent dev database.
- Treat migrations as forward-only for ordinary local work.
- Back up before destructive refactors or large seed refreshes.

Useful backup and restore commands:

```powershell
docker compose -f ops/docker-compose.dev.yml exec -T postgres pg_dump -U lendq lendq_dev > .\lendq_dev_backup.sql
Get-Content .\lendq_dev_backup.sql | docker compose -f ops/docker-compose.dev.yml exec -T postgres psql -U lendq -d lendq_dev
```

## Seeding Strategy

Create three seed profiles:

- `baseline`: roles, permissions, one admin account, reference settings
- `demo`: baseline plus sample users, loans, payments, notifications, and change history
- `test`: deterministic fixtures for automated tests only

Seed design rules:

- Seed scripts must be idempotent.
- Reference data such as roles and permissions should be upserted, not blindly inserted.
- Demo data should be easy to reset without wiping the persistent database volume.
- Seed scripts should print created or updated records clearly.
- Do not combine migrations and seeding into a single hidden startup step.

Recommended commands:

```powershell
.venv\Scripts\python -m app.seed --profile baseline
.venv\Scripts\python -m app.seed --profile demo
```

Recommended demo data:

- `Admin` user
- one `Creditor`
- two `Borrower` users
- loans in `ACTIVE`, `PAUSED`, `OVERDUE`, and `PAID_OFF` states
- payments showing scheduled, partial, rescheduled, and paid scenarios
- notifications that exercise unread count, list filtering, and toast flows

## Suggested Editor And Browser Extensions

VS Code:

- `Python` by Microsoft
- `Pylance`
- `Ruff`
- `Docker`
- `ESLint`
- `Prettier`
- `Tailwind CSS IntelliSense`
- `PostgreSQL` or `SQLTools`
- `REST Client` or `Thunder Client`
- `Error Lens`
- `GitLens`

Browser:

- `React Developer Tools`

Project-level dev tools to add early:

- TanStack Query Devtools in the frontend
- a structured logging formatter for Python
- optional OpenTelemetry hooks once tracing is introduced

## Playwright Local Verification Workflow

Use Playwright in layers instead of defaulting to the full browser-and-device matrix on every edit:

- Fastest local loop: `npm --prefix e2e run test`
- Targeted smoke verification: `npm --prefix e2e run test:smoke`
- Re-run only changed specs: `npm --prefix e2e run test:changed`
- Re-run only the last failed tests: `npm --prefix e2e run test:last-failed`
- Responsive checks when layout changes: `npm --prefix e2e run test:responsive`
- Cross-browser smoke verification: `npm --prefix e2e run test:cross-browser`
- Full regression only when explicitly needed: `npm --prefix e2e run test:full`

Recommended order of use:

1. Run a single file or grep-targeted command while building the feature.
2. Run the Chromium-only default command before asking for review.
3. Run the smoke suite before merging larger feature changes.
4. Run cross-browser or full regression only for release-risk changes or explicit verification.

Useful direct Playwright commands:

```bash
npm --prefix e2e exec -- playwright test tests/loans/create-loan.spec.ts --project=chromium-desktop
npm --prefix e2e exec -- playwright test --grep "creates loan" --project=chromium-desktop
npm --prefix e2e run test:ui
npm --prefix e2e run test:debug
```

The goal is to keep the everyday feedback loop on `chromium-desktop` and reserve the full matrix for deliberate regression checks.

## Practical Debugging Workflow

For most bugs, use this order:

1. Reproduce with browser Network tools open.
2. Watch API logs in a dedicated terminal.
3. If the request shape is wrong, debug the frontend first.
4. If the request shape is correct but behavior is wrong, debug the Flask service layer.
5. If the side effect is asynchronous, inspect worker logs and then attach a worker debugger.
6. Check the database directly only after confirming what the app attempted to do.

This keeps you from debugging the wrong layer first.

## Workflow Guardrails

- Keep local logging verbose enough for debugging but safe enough that secrets never appear in logs.
- Do not seed automatically on every startup.
- Do not recreate the database container just to pick up application code changes.
- Do not debug only in the browser when the issue spans API and worker boundaries.
- Do not use the persistent dev database for automated tests.

## Minimum Definition Of Done For Local Dev Setup

The local platform setup is ready when a developer can:

1. Start infrastructure with one command.
2. Run migrations explicitly.
3. Seed baseline or demo data explicitly.
4. Start frontend, API, worker, and scheduler independently.
5. Hit health checks successfully.
6. Set breakpoints in API and frontend code.
7. View logs for every process without hunting for files.
8. Stop and restart the stack without losing the development database.

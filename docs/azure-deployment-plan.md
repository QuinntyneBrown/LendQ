# Azure Deployment Plan: Staging and Production

**Status**: Draft
**Last updated**: 2026-03-28

> This document is the fuller production-oriented target architecture. If you want the lowest-cost Azure path with the best developer experience, start with [azure-cheapest-deployment.md](./azure-cheapest-deployment.md).

## Contents

- [1. Goals and Constraints](#1-goals-and-constraints)
- [2. Environment Strategy](#2-environment-strategy)
- [3. Azure Resource Architecture](#3-azure-resource-architecture)
- [4. Infrastructure as Code](#4-infrastructure-as-code)
- [5. Container Strategy](#5-container-strategy)
- [6. CI/CD Pipeline](#6-cicd-pipeline)
- [7. Staging-to-Production Promotion](#7-staging-to-production-promotion)
- [8. Secrets and Configuration Management](#8-secrets-and-configuration-management)
- [9. Networking and Security](#9-networking-and-security)
- [10. Observability](#10-observability)
- [11. Backup, Recovery, and Resilience](#11-backup-recovery-and-resilience)
- [12. Cost Considerations](#12-cost-considerations)
- [13. Rollback Procedures](#13-rollback-procedures)
- [14. Implementation Roadmap](#14-implementation-roadmap)

---

## 1. Goals and Constraints

### Goals

1. Deploy the LendQ stack (Flask API, Celery workers, Celery Beat, React SPA, PostgreSQL, Redis) to Azure.
2. Maintain a **staging** environment that mirrors production for validation.
3. Provide a controlled, auditable **promotion** path from staging to production.
4. Automate infrastructure provisioning and application deployment through CI/CD.
5. Meet the operational readiness baseline defined in [Module 16](detailed-designs/16-operational-readiness-and-api-governance.md).

### Constraints

- Single-region deployment initially; multi-region is a future consideration.
- The backend already supports environment-based configuration via `config_by_name` in `backend/app/config.py` (development, testing, production).
- Health endpoints exist at `/health/live` (liveness) and `/health/ready` (readiness with database/Redis checks).
- The frontend is a static SPA built by Vite; it calls the API at the same origin via `/api/v1`.

---

## 2. Environment Strategy

| Environment | Purpose | Branch trigger | URL pattern |
|---|---|---|---|
| **Staging** | Pre-production validation, integration testing, UAT | Push to `main` | `staging.lendq.com` |
| **Production** | Live user-facing environment | Manual promotion from staging | `app.lendq.com` |

### Environment parity

Both environments use the same Azure service SKUs (scaled down for staging where cost-effective), identical container images, and the same Bicep templates parameterized per environment. The only differences are:

- SKU tier/scale (e.g., fewer replicas, smaller database compute in staging)
- Domain names and TLS certificates
- Secret values (keys, connection strings, credentials)
- Feature flags (if introduced later)

---

## 3. Azure Resource Architecture

### Resource groups

```
rg-lendq-staging        # All staging resources
rg-lendq-production     # All production resources
rg-lendq-shared         # Container registry, DNS zone, Log Analytics workspace
```

### Azure services per environment

| Component | Azure service | SKU (staging) | SKU (production) | Notes |
|---|---|---|---|---|
| **Backend API** | Azure Container Apps | Consumption | Consumption (or Dedicated D4) | Scales 1-5 replicas (staging 1-2) |
| **Celery worker** | Azure Container Apps | Consumption | Consumption | Scale based on queue depth |
| **Celery Beat** | Azure Container Apps | Consumption | Consumption | Single replica only; uses leader election or min/max 1 |
| **Frontend SPA** | Azure Static Web Apps | Free | Standard | Serves Vite build output; built-in CDN and TLS |
| **Database** | Azure Database for PostgreSQL Flexible Server | Burstable B1ms | General Purpose D2ds_v4 | Version 15, matching local dev |
| **Cache / broker** | Azure Cache for Redis | Basic C0 | Standard C1 | Used by Celery broker, rate limiter, coordination state |
| **Email** | Azure Communication Services (Email) | Pay-per-message | Pay-per-message | Replaces Mailpit in staging/production |
| **Secrets** | Azure Key Vault | Standard | Standard | All secrets, keys, connection strings |
| **Container images** | Azure Container Registry | Basic | Basic | Shared across environments |
| **DNS** | Azure DNS | Standard | Standard | Shared zone for `lendq.com` |
| **Logs and metrics** | Azure Monitor / Log Analytics | Pay-as-you-go | Pay-as-you-go | Shared workspace with per-environment tagging |
| **Alerts** | Azure Monitor Alerts | — | — | Configured per environment with different severity routing |

### Architecture diagram (text)

```
                        ┌──────────────────────────────────────────────────┐
                        │              Azure DNS (lendq.com)               │
                        └────────────┬─────────────────┬───────────────────┘
                                     │                 │
                          staging.lendq.com      app.lendq.com
                                     │                 │
                        ┌────────────▼──┐    ┌────────▼────────┐
                        │  Static Web   │    │   Static Web    │
                        │  Apps (SPA)   │    │   Apps (SPA)    │
                        └────────┬──────┘    └────────┬────────┘
                                 │ /api/*             │ /api/*
                        ┌────────▼──────────────────────────────┐
                        │     Container Apps Environment        │
                        │  ┌─────────┐ ┌────────┐ ┌──────────┐ │
                        │  │ API     │ │ Worker │ │  Beat    │ │
                        │  │ (Flask) │ │(Celery)│ │ (Celery) │ │
                        │  └────┬────┘ └───┬────┘ └────┬─────┘ │
                        └───────┼──────────┼───────────┼───────┘
                                │          │           │
                   ┌────────────┼──────────┼───────────┘
                   │            │          │
            ┌──────▼──────┐ ┌──▼──────────▼──┐  ┌───────────┐
            │ PostgreSQL  │ │  Azure Redis    │  │ Key Vault │
            │ Flex Server │ │  Cache          │  │           │
            └─────────────┘ └─────────────────┘  └───────────┘
```

---

## 4. Infrastructure as Code

### Tool choice: Bicep

All Azure resources are provisioned using **Bicep** templates stored under `ops/azure/`.

```
ops/azure/
├── main.bicep                  # Orchestrator — calls modules, parameterized by env
├── main.staging.bicepparam     # Staging parameter values
├── main.production.bicepparam  # Production parameter values
├── modules/
│   ├── container-apps.bicep    # Container Apps environment, API, worker, beat apps
│   ├── database.bicep          # PostgreSQL Flexible Server + databases
│   ├── redis.bicep             # Azure Cache for Redis
│   ├── keyvault.bicep          # Key Vault + access policies
│   ├── static-webapp.bicep     # Static Web Apps for SPA
│   ├── monitoring.bicep        # Log Analytics, Application Insights, alerts
│   ├── acr.bicep               # Container registry (shared module)
│   └── dns.bicep               # DNS zone and records (shared module)
└── scripts/
    ├── deploy-infra.sh         # Wrapper: az deployment group create
    └── seed-keyvault.sh        # One-time: push initial secrets to Key Vault
```

### Key parameters

| Parameter | Staging value | Production value |
|---|---|---|
| `environmentName` | `staging` | `production` |
| `apiMinReplicas` | `1` | `2` |
| `apiMaxReplicas` | `2` | `5` |
| `workerMinReplicas` | `1` | `2` |
| `workerMaxReplicas` | `2` | `10` |
| `beatReplicas` | `1` | `1` |
| `dbSkuName` | `Standard_B1ms` | `Standard_D2ds_v4` |
| `dbStorageSizeGb` | `32` | `128` |
| `redisSku` | `Basic` | `Standard` |
| `redisCapacity` | `0` (250 MB) | `1` (1 GB) |
| `customDomain` | `staging.lendq.com` | `app.lendq.com` |

---

## 5. Container Strategy

### Dockerfiles

Two Dockerfiles are needed (added under the respective project roots):

**`backend/Dockerfile`**

```dockerfile
FROM python:3.11-slim AS base
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

# API entrypoint
FROM base AS api
EXPOSE 8000
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "--timeout", "120", "app:create_app()"]

# Celery worker entrypoint
FROM base AS worker
CMD ["celery", "-A", "app.celery_app:celery", "worker", "--loglevel=info", "--concurrency=4"]

# Celery Beat entrypoint
FROM base AS beat
CMD ["celery", "-A", "app.celery_app:celery", "beat", "--loglevel=info"]
```

**`frontend/Dockerfile`** (build only — output deployed to Static Web Apps)

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
# Output: /app/dist/
```

### Image tagging

Images are tagged with the Git SHA and pushed to Azure Container Registry:

```
lendqacr.azurecr.io/lendq-api:<git-sha>
lendqacr.azurecr.io/lendq-worker:<git-sha>   # Same image, different CMD
lendqacr.azurecr.io/lendq-beat:<git-sha>      # Same image, different CMD
```

The API, worker, and beat containers share a single image; Container Apps overrides the command per app.

---

## 6. CI/CD Pipeline

### Platform: GitHub Actions

All pipelines live under `.github/workflows/`.

### Workflow: `ci.yml` — Continuous Integration

**Trigger**: Pull request to `main`, push to `main`

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Lint &      │     │  Backend Tests   │     │  Frontend Build  │
│  Type Check  │     │  (pytest)        │     │  & Lint          │
│  (parallel)  │     │                  │     │                  │
└──────┬───────┘     └────────┬─────────┘     └────────┬─────────┘
       │                      │                        │
       └──────────────────────┼────────────────────────┘
                              ▼
                     ┌────────────────┐
                     │  E2E Tests     │
                     │  (Playwright)  │
                     └────────────────┘
```

Steps:

1. **Lint and type-check** (parallel jobs)
   - Backend: `ruff check backend/`
   - Frontend: `npm --prefix frontend run lint && npm --prefix frontend run build`
2. **Backend tests**: Start PostgreSQL + Redis services, run `pytest`
3. **Frontend build**: Confirm `npm run build` succeeds
4. **E2E tests**: Start backend + frontend, run Playwright suite
5. **Dependency/SAST scan**: `pip-audit`, `npm audit`, CodeQL or Semgrep
6. **Migration check**: Run `flask db upgrade` against a test PostgreSQL to validate migration chain

### Workflow: `deploy-staging.yml` — Deploy to Staging

**Trigger**: Push to `main` (after CI passes)

```
┌────────────┐    ┌───────────────┐    ┌────────────────────┐    ┌────────────────┐
│ Build &    │───▶│ Push image to │───▶│ Deploy Container   │───▶│ Run DB         │
│ tag image  │    │ ACR           │    │ Apps (staging)     │    │ migrations     │
└────────────┘    └───────────────┘    └────────────────────┘    └───────┬────────┘
                                                                        │
                  ┌───────────────┐    ┌────────────────────┐           │
                  │ Deploy SPA to │───▶│ Smoke tests        │◀──────────┘
                  │ Static Web    │    │ (health + critical │
                  │ Apps          │    │  paths)            │
                  └───────────────┘    └────────────────────┘
```

Steps:

1. **Build backend image** tagged with `${{ github.sha }}`
2. **Push to ACR**: `docker push lendqacr.azurecr.io/lendq-api:<sha>`
3. **Run database migrations**: A one-off Container Apps job runs `flask db upgrade` against the staging database
4. **Update Container Apps revisions**: Set new image tag for API, worker, and beat apps
5. **Build and deploy frontend**: `npm run build`, deploy `dist/` to Azure Static Web Apps via the SWA CLI or GitHub integration
6. **Smoke tests**: Hit `/health/ready`, verify HTTP 200; run a minimal Playwright subset against `staging.lendq.com`
7. **Notify**: Post result to the team (Slack webhook, GitHub deployment status)

### Workflow: `promote-production.yml` — Promote to Production

**Trigger**: Manual (`workflow_dispatch`) with required input: the staging image SHA to promote

See [Section 7](#7-staging-to-production-promotion) for the full promotion flow.

---

## 7. Staging-to-Production Promotion

### Principles

- **No new builds for production**. The exact container image validated in staging is deployed to production.
- **Explicit human approval**. Production deployment requires a manual trigger plus a GitHub Environment protection rule (required reviewer).
- **Database migrations run before traffic shift**. Migrations must be backward-compatible so the old revision can still serve traffic during rollout.
- **Traffic shift is gradual**. Container Apps revision-based traffic splitting enables canary or blue-green rollout.

### Promotion workflow

```
┌────────────────────────────────────────────────────────────────────┐
│                    promote-production.yml                          │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  1. Input: image_sha (the git SHA currently running in staging)    │
│                                                                    │
│  2. Pre-flight checks                                              │
│     ├─ Verify image_sha exists in ACR                              │
│     ├─ Verify staging health is green for this SHA                 │
│     ├─ Verify staging smoke tests passed in the last deploy        │
│     └─ Verify no pending migrations that haven't been staged       │
│                                                                    │
│  3. Require GitHub Environment approval (production)               │
│     └─ Designated reviewers must approve before proceeding         │
│                                                                    │
│  4. Run database migrations against production                     │
│     └─ One-off Container Apps job: flask db upgrade                │
│                                                                    │
│  5. Deploy new revision to production Container Apps               │
│     ├─ API:    image_sha, traffic weight 10%                       │
│     ├─ Worker: image_sha, traffic weight 100% (no user traffic)    │
│     └─ Beat:   image_sha, traffic weight 100%                      │
│                                                                    │
│  6. Canary validation (5 minutes)                                  │
│     ├─ Monitor error rate, latency, 5xx count                      │
│     └─ If anomaly → automatic rollback (set old revision to 100%)  │
│                                                                    │
│  7. Ramp traffic                                                   │
│     ├─ 10% → 50% → 100% over ~15 minutes                          │
│     └─ Each step waits for metric validation                       │
│                                                                    │
│  8. Deactivate old revision                                        │
│                                                                    │
│  9. Deploy frontend SPA to production Static Web Apps              │
│     └─ Same dist/ artifact built from the same SHA                 │
│                                                                    │
│ 10. Post-deploy smoke tests against app.lendq.com                  │
│                                                                    │
│ 11. Tag release: git tag v<semver> on image_sha                    │
│                                                                    │
│ 12. Notify team                                                    │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### GitHub Environment configuration

| Environment | Protection rules |
|---|---|
| `staging` | None (auto-deploy on main push) |
| `production` | Required reviewers (at least 1), deployment branch restricted to `main` |

### Artifact traceability

Every production deployment is traceable:

- **Container image**: ACR tag matches the Git SHA
- **Git tag**: `v<major>.<minor>.<patch>` points to the promoted commit
- **GitHub deployment record**: Links the workflow run, image SHA, environment, approver, and timestamp
- **Database migration version**: Logged by Alembic; the revision hash is stored in the `alembic_version` table

---

## 8. Secrets and Configuration Management

### Secret storage: Azure Key Vault

| Secret name | Description | Rotation |
|---|---|---|
| `SECRET-KEY` | Flask session signing key | Quarterly |
| `JWT-SECRET-KEY` | JWT token signing key | Quarterly |
| `DATABASE-URL` | PostgreSQL connection string | On credential rotation |
| `REDIS-URL` | Redis connection string (with auth) | On credential rotation |
| `MAIL-API-KEY` | Azure Communication Services key | Annually |

### How secrets reach the application

1. Key Vault secrets are referenced in Container Apps configuration as **secret references**.
2. Container Apps injects them as environment variables at runtime.
3. The Flask `Config` class reads `os.environ` — no code changes needed.

```
Key Vault  ──secret ref──▶  Container App secrets  ──env var──▶  Flask Config
```

### Non-secret configuration

Non-sensitive configuration (feature flags, log levels, rate-limit values) is set as plain environment variables in the Container Apps definition, parameterized per environment via Bicep.

| Variable | Staging | Production |
|---|---|---|
| `FLASK_ENV` | `production` | `production` |
| `LOG_LEVEL` | `DEBUG` | `INFO` |
| `LOG_FORMAT` | `json` | `json` |
| `CORS_ORIGINS` | `https://staging.lendq.com` | `https://app.lendq.com` |
| `RATELIMIT_DEFAULT` | `200/hour` | `200/hour` |
| `RATE_LIMIT_AUTH` | `5/minute` | `5/minute` |

> Note: `FLASK_ENV` is set to `production` in both staging and production. The `ProductionConfig` class enforces that `SECRET_KEY` and `JWT_SECRET_KEY` are set — this prevents accidental use of development defaults outside local dev.

---

## 9. Networking and Security

### Network topology

```
Internet
   │
   ├──▶ Azure Static Web Apps (SPA) ── built-in CDN + TLS
   │
   └──▶ Container Apps Environment (VNet-integrated)
         ├── API (ingress: external, HTTPS only)
         ├── Worker (ingress: none — internal only)
         └── Beat (ingress: none — internal only)
              │
              ├──▶ PostgreSQL (VNet private endpoint, no public access)
              ├──▶ Redis (VNet private endpoint, no public access)
              └──▶ Key Vault (VNet private endpoint)
```

### Security controls

| Control | Implementation |
|---|---|
| TLS everywhere | Azure-managed certificates on Static Web Apps and Container Apps custom domains; TLS 1.2 minimum |
| Database access | Private endpoint only; no public IP; SSL enforced |
| Redis access | Private endpoint only; access key authentication + in-transit encryption |
| Key Vault access | Container Apps managed identity (system-assigned); RBAC role `Key Vault Secrets User` |
| Container registry | Managed identity pull; no admin credentials |
| IP restrictions | Optional: restrict Container Apps ingress to Static Web Apps outbound IPs + health-check probes |
| Security headers | Already implemented in Flask middleware (CSP, HSTS, X-Frame-Options, etc.) |
| Rate limiting | Flask-Limiter backed by Redis; configured via environment variables |
| WAF (future) | Azure Front Door with WAF policies can be added in front of Container Apps for DDoS and OWASP rule sets |

### Managed identity chain

```
Container Apps (system-assigned identity)
   ├── Key Vault: Secrets User role
   ├── ACR: AcrPull role
   └── (future) Storage: Blob Data Contributor
```

No connection-string credentials are stored for Key Vault or ACR access. PostgreSQL and Redis connection strings are stored in Key Vault because those services require traditional credentials.

---

## 10. Observability

### Stack

| Layer | Tool |
|---|---|
| Logs | Azure Monitor Logs (Log Analytics workspace) |
| Metrics | Azure Monitor Metrics + Application Insights |
| Traces | Application Insights (OpenTelemetry-compatible) |
| Dashboards | Azure Workbooks or Grafana (Azure Managed Grafana) |
| Alerts | Azure Monitor Alerts → Action Groups (email, Slack webhook) |

### Application-level integration

The backend already produces JSON structured logs with `request_id`, `user_id`, `session_id`, status code, and latency. To forward these to Azure Monitor:

1. Container Apps **automatically** streams stdout/stderr to Log Analytics.
2. Add the `opentelemetry-distro` and `azure-monitor-opentelemetry-exporter` packages to `requirements.txt` for trace and metric export.
3. Set the `APPLICATIONINSIGHTS_CONNECTION_STRING` environment variable — the OpenTelemetry SDK picks it up automatically.

### Key alerts

| Alert | Condition | Severity | Staging | Production |
|---|---|---|---|---|
| API error rate | 5xx rate > 5% over 5 minutes | Sev 1 | Email | Email + Slack |
| API latency P95 | > 2 seconds over 5 minutes | Sev 2 | Email | Email + Slack |
| Database CPU | > 80% for 10 minutes | Sev 2 | Email | Email + Slack |
| Redis memory | > 80% capacity | Sev 2 | Email | Email + Slack |
| Worker queue depth | > 100 pending tasks for 10 minutes | Sev 2 | Email | Email + Slack |
| Migration failure | Deploy job exit code != 0 | Sev 1 | Email | Email + Slack + PagerDuty |
| Health check failure | `/health/ready` returns non-200 for 3 consecutive checks | Sev 1 | Email | Email + Slack |
| Certificate expiry | < 14 days to expiration | Sev 3 | Email | Email |

---

## 11. Backup, Recovery, and Resilience

### Database backups

| Feature | Configuration |
|---|---|
| Automated backups | Azure PostgreSQL Flexible Server built-in: continuous backup with point-in-time restore |
| Retention | Staging: 7 days; Production: 35 days |
| Geo-redundancy | Production: geo-redundant backup storage enabled |
| Restore drill | Monthly: restore production backup to an isolated resource group, run read-only validation queries, tear down |

### Redis

Azure Cache for Redis provides built-in persistence (AOF or RDB) on Standard tier and above. Since Redis is used as a broker and rate-limit store (not primary data), loss of Redis state is recoverable:

- Celery tasks are re-queued by workers on restart
- Rate-limit counters reset (acceptable)

### Application resilience

| Scenario | Mitigation |
|---|---|
| Bad deployment | Canary rollout catches regressions; automatic rollback to previous revision |
| Database failover | Azure PostgreSQL HA (zone-redundant in production) handles automatic failover; `/health/ready` will fail during brief switchover, preventing traffic routing |
| Redis outage | Rate limiter falls back to in-memory (degraded but functional); Celery retries with backoff |
| Region outage | Out of scope for initial deployment; future work adds a paired region with Azure Front Door traffic manager |

### Recovery objectives (initial targets)

| Metric | Staging | Production |
|---|---|---|
| RPO (Recovery Point Objective) | 24 hours | 1 hour (point-in-time restore) |
| RTO (Recovery Time Objective) | 4 hours | 1 hour |

---

## 12. Cost Considerations

### Estimated monthly cost (USD, approximate)

| Resource | Staging | Production |
|---|---|---|
| Container Apps (API, 1 replica avg) | ~$15 | ~$60 (2-5 replicas) |
| Container Apps (Worker, 1 replica avg) | ~$10 | ~$40 (2-5 replicas) |
| Container Apps (Beat, 1 replica) | ~$5 | ~$5 |
| PostgreSQL Flex B1ms / D2ds_v4 | ~$25 | ~$150 |
| Azure Cache for Redis C0 / C1 | ~$17 | ~$55 |
| Static Web Apps Free / Standard | $0 | ~$9 |
| Key Vault (operations) | ~$1 | ~$1 |
| Container Registry Basic | ~$5 | (shared) |
| Log Analytics (5 GB/day) | ~$12 | ~$12 |
| Azure DNS | ~$1 | (shared) |
| **Total (estimated)** | **~$90/month** | **~$335/month** |

> These are baseline estimates. Actual costs depend on traffic, data volume, and scaling behavior. Use Azure Cost Management + budget alerts to track spend.

### Cost optimization levers

- **Staging scale-to-zero**: Container Apps Consumption plan scales to zero when idle; staging costs near-zero outside business hours.
- **Reserved instances**: For production PostgreSQL, a 1-year reservation can save ~35%.
- **Dev/test pricing**: If staging resources are tagged for dev/test, certain services offer reduced rates.

---

## 13. Rollback Procedures

### Application rollback

Container Apps maintains previous revisions. To roll back:

```bash
# List revisions
az containerapp revision list -n lendq-api -g rg-lendq-production -o table

# Shift 100% traffic to the previous revision
az containerapp ingress traffic set -n lendq-api -g rg-lendq-production \
  --revision-weight <previous-revision>=100
```

For the frontend SPA, Azure Static Web Apps supports environment snapshots. Redeploy the previous build artifact.

### Database rollback

If a migration introduced a breaking schema change:

1. **If the migration is backward-compatible** (additive columns, new tables): no rollback needed; the old application revision still works.
2. **If the migration is breaking**: Use Alembic's downgrade capability. This requires that all migrations include a tested `downgrade()` function.
   ```bash
   flask db downgrade <target-revision>
   ```
3. **Last resort**: Point-in-time restore of the PostgreSQL database to a moment before the migration ran. This affects all data written after that point.

### Rollback decision matrix

| Symptom | Action |
|---|---|
| Error rate spike after deploy, < 5 min | Automatic rollback via canary validation |
| Error rate spike after full rollout | Manual: shift traffic to previous revision |
| Data corruption from migration | Assess scope; downgrade migration or point-in-time restore |
| Frontend rendering broken | Redeploy previous SPA build artifact |

---

## 14. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

- [ ] Create Azure resource groups and shared resources (ACR, DNS zone, Log Analytics)
- [ ] Write Bicep modules for Key Vault, PostgreSQL, Redis
- [ ] Write `backend/Dockerfile` (multi-stage with api/worker/beat targets)
- [ ] Validate local Docker build and `docker compose` equivalent for the full stack
- [ ] Seed Key Vault with initial secrets

### Phase 2: Staging environment (Week 3-4)

- [ ] Write Bicep modules for Container Apps environment, API/worker/beat apps
- [ ] Write Bicep module for Static Web Apps
- [ ] Create `deploy-staging.yml` GitHub Actions workflow
- [ ] Deploy staging environment end-to-end
- [ ] Configure custom domain `staging.lendq.com` with TLS
- [ ] Run database migrations and seed staging data
- [ ] Validate health checks, API responses, and SPA rendering on staging
- [ ] Configure staging alerts

### Phase 3: CI pipeline (Week 4-5)

- [ ] Create `ci.yml` with lint, test, build, E2E, and security scan jobs
- [ ] Add migration validation step (upgrade + downgrade against test DB)
- [ ] Configure branch protection rules requiring CI pass before merge

### Phase 4: Production environment and promotion (Week 5-6)

- [ ] Deploy production infrastructure via Bicep (same templates, production params)
- [ ] Configure custom domain `app.lendq.com` with TLS
- [ ] Create `promote-production.yml` with approval gates and canary rollout
- [ ] Configure GitHub Environment protection rules for `production`
- [ ] Perform first staging-to-production promotion
- [ ] Configure production alerts with escalation routing
- [ ] Set up database backup validation schedule

### Phase 5: Hardening (Week 7-8)

- [ ] Enable VNet integration and private endpoints for PostgreSQL, Redis, Key Vault
- [ ] Add OpenTelemetry instrumentation to the backend (`opentelemetry-distro`)
- [ ] Build Azure Workbook dashboards for API latency, error rates, queue depth
- [ ] Run load tests against staging; tune autoscaling thresholds
- [ ] Document runbook for common operational scenarios (rollback, failover, restore drill)
- [ ] Conduct first backup restore drill

---

## Appendix A: GitHub Actions Workflow Skeleton

### `deploy-staging.yml`

```yaml
name: Deploy to Staging

on:
  push:
    branches: [main]

permissions:
  id-token: write
  contents: read

env:
  ACR_NAME: lendqacr
  IMAGE_NAME: lendq-api
  RESOURCE_GROUP: rg-lendq-staging
  CONTAINER_APP_API: lendq-api-staging
  CONTAINER_APP_WORKER: lendq-worker-staging
  CONTAINER_APP_BEAT: lendq-beat-staging
  SWA_NAME: lendq-swa-staging

jobs:
  ci:
    uses: ./.github/workflows/ci.yml

  build-and-push:
    needs: ci
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Login to Azure
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Login to ACR
        run: az acr login --name ${{ env.ACR_NAME }}

      - name: Build and push backend image
        run: |
          docker build -t ${{ env.ACR_NAME }}.azurecr.io/${{ env.IMAGE_NAME }}:${{ github.sha }} \
            --target api backend/
          docker push ${{ env.ACR_NAME }}.azurecr.io/${{ env.IMAGE_NAME }}:${{ github.sha }}

  migrate:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Run migrations
        run: |
          az containerapp job start \
            --name lendq-migrate-staging \
            --resource-group ${{ env.RESOURCE_GROUP }} \
            --image ${{ env.ACR_NAME }}.azurecr.io/${{ env.IMAGE_NAME }}:${{ github.sha }} \
            --command "flask" "--" "db" "upgrade"

  deploy-backend:
    needs: migrate
    runs-on: ubuntu-latest
    steps:
      - uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Update API container app
        run: |
          az containerapp update \
            --name ${{ env.CONTAINER_APP_API }} \
            --resource-group ${{ env.RESOURCE_GROUP }} \
            --image ${{ env.ACR_NAME }}.azurecr.io/${{ env.IMAGE_NAME }}:${{ github.sha }}

      - name: Update Worker container app
        run: |
          az containerapp update \
            --name ${{ env.CONTAINER_APP_WORKER }} \
            --resource-group ${{ env.RESOURCE_GROUP }} \
            --image ${{ env.ACR_NAME }}.azurecr.io/${{ env.IMAGE_NAME }}:${{ github.sha }}

      - name: Update Beat container app
        run: |
          az containerapp update \
            --name ${{ env.CONTAINER_APP_BEAT }} \
            --resource-group ${{ env.RESOURCE_GROUP }} \
            --image ${{ env.ACR_NAME }}.azurecr.io/${{ env.IMAGE_NAME }}:${{ github.sha }}

  deploy-frontend:
    needs: ci
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: frontend/package-lock.json

      - name: Build frontend
        run: npm ci && npm run build
        working-directory: frontend

      - name: Deploy to Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.SWA_DEPLOY_TOKEN_STAGING }}
          action: upload
          app_location: frontend/dist
          skip_app_build: true

  smoke-test:
    needs: [deploy-backend, deploy-frontend]
    runs-on: ubuntu-latest
    steps:
      - name: Health check
        run: |
          for i in {1..10}; do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://staging.lendq.com/api/v1/health/ready)
            if [ "$STATUS" = "200" ]; then echo "Healthy"; exit 0; fi
            sleep 10
          done
          echo "Health check failed"; exit 1
```

### `promote-production.yml`

```yaml
name: Promote to Production

on:
  workflow_dispatch:
    inputs:
      image_sha:
        description: "Git SHA of the image to promote (must be currently deployed to staging)"
        required: true
        type: string

permissions:
  id-token: write
  contents: write

env:
  ACR_NAME: lendqacr
  IMAGE_NAME: lendq-api
  RESOURCE_GROUP: rg-lendq-production

jobs:
  preflight:
    runs-on: ubuntu-latest
    steps:
      - name: Verify image exists in ACR
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - run: |
          az acr manifest show \
            --registry ${{ env.ACR_NAME }} \
            --name ${{ env.IMAGE_NAME }}:${{ inputs.image_sha }}

      - name: Verify staging is healthy
        run: |
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://staging.lendq.com/api/v1/health/ready)
          [ "$STATUS" = "200" ] || (echo "Staging unhealthy"; exit 1)

  deploy:
    needs: preflight
    runs-on: ubuntu-latest
    environment: production   # <-- triggers required reviewer approval
    steps:
      - uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Run production migrations
        run: |
          az containerapp job start \
            --name lendq-migrate-production \
            --resource-group ${{ env.RESOURCE_GROUP }} \
            --image ${{ env.ACR_NAME }}.azurecr.io/${{ env.IMAGE_NAME }}:${{ inputs.image_sha }} \
            --command "flask" "--" "db" "upgrade"

      - name: Deploy API with 10% canary
        run: |
          az containerapp update \
            --name lendq-api-production \
            --resource-group ${{ env.RESOURCE_GROUP }} \
            --image ${{ env.ACR_NAME }}.azurecr.io/${{ env.IMAGE_NAME }}:${{ inputs.image_sha }}

          NEW_REV=$(az containerapp revision list -n lendq-api-production \
            -g ${{ env.RESOURCE_GROUP }} --query "[0].name" -o tsv)
          OLD_REV=$(az containerapp revision list -n lendq-api-production \
            -g ${{ env.RESOURCE_GROUP }} --query "[1].name" -o tsv)

          az containerapp ingress traffic set -n lendq-api-production \
            -g ${{ env.RESOURCE_GROUP }} \
            --revision-weight "$NEW_REV=10" "$OLD_REV=90"

      - name: Canary validation (5 min)
        run: |
          sleep 300
          # Check error rate via Azure Monitor query or simple health check
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://app.lendq.com/api/v1/health/ready)
          [ "$STATUS" = "200" ] || (echo "Canary unhealthy — rolling back"; \
            az containerapp ingress traffic set -n lendq-api-production \
              -g ${{ env.RESOURCE_GROUP }} \
              --revision-weight "$OLD_REV=100"; exit 1)

      - name: Ramp to 100%
        run: |
          NEW_REV=$(az containerapp revision list -n lendq-api-production \
            -g ${{ env.RESOURCE_GROUP }} --query "[0].name" -o tsv)
          az containerapp ingress traffic set -n lendq-api-production \
            -g ${{ env.RESOURCE_GROUP }} \
            --revision-weight "$NEW_REV=100"

      - name: Update worker and beat
        run: |
          az containerapp update --name lendq-worker-production \
            --resource-group ${{ env.RESOURCE_GROUP }} \
            --image ${{ env.ACR_NAME }}.azurecr.io/${{ env.IMAGE_NAME }}:${{ inputs.image_sha }}
          az containerapp update --name lendq-beat-production \
            --resource-group ${{ env.RESOURCE_GROUP }} \
            --image ${{ env.ACR_NAME }}.azurecr.io/${{ env.IMAGE_NAME }}:${{ inputs.image_sha }}

  deploy-frontend:
    needs: deploy
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ inputs.image_sha }}

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: frontend/package-lock.json

      - run: npm ci && npm run build
        working-directory: frontend

      - uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.SWA_DEPLOY_TOKEN_PRODUCTION }}
          action: upload
          app_location: frontend/dist
          skip_app_build: true

  post-deploy:
    needs: deploy-frontend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Smoke test production
        run: |
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://app.lendq.com/api/v1/health/ready)
          [ "$STATUS" = "200" ] || (echo "Production smoke test failed"; exit 1)

      - name: Tag release
        run: |
          git tag "deploy-production-$(date +%Y%m%d-%H%M%S)-${{ inputs.image_sha }}"
          git push origin --tags
```

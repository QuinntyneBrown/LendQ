# Azure Cheapest Deployment Recommendation

**Status**: Recommended starting point  
**Last reviewed**: 2026-03-28

## Bottom line

No, Kubernetes is not the cheapest or best developer experience for LendQ on Azure right now.

For this repository, the best low-cost Azure path is:

1. **Frontend**: Azure Static Web Apps
2. **Backend API**: one Azure Container App on the **Consumption** plan
3. **Database**: Azure Database for PostgreSQL Flexible Server on the **Burstable** tier
4. **CI/CD**: GitHub Actions with OIDC
5. **Redis, Celery worker, Celery beat, Key Vault, and a second always-on environment**: defer until the application proves it needs them

That gives the lowest operational overhead while staying close to the app's current architecture.

## Short answer on Kubernetes

Do not start with AKS for this project.

Why:

- Microsoft says AKS is the right choice when you need direct access to the Kubernetes API and cluster control. Azure Container Apps is the fully managed option for Kubernetes-style apps when you do **not** need that control plane access, and Microsoft explicitly says many teams prefer to start there.
- AKS Free tier only makes cluster management free. You still pay for the resources you consume, which means you are still paying for the worker nodes and everything around them.
- This app does not currently justify the extra cluster operations burden: manifests or Helm, ingress, secrets strategy, node sizing, upgrades, autoscaling behavior, and cluster debugging.

Official references:

- AKS vs other Azure container options: <https://learn.microsoft.com/en-us/azure/aks/compare-container-options-with-aks>
- AKS pricing tiers: <https://learn.microsoft.com/en-us/azure/aks/free-standard-pricing-tiers>

## Current repo review

The current Azure deployment plan in this repo is a **production-oriented target architecture**, not the cheapest path:

- It assumes **staging and production** from day one.
- It provisions **API + worker + beat + Redis + PostgreSQL + Static Web Apps + Key Vault + ACR + monitoring**.
- It assumes background workers are always present, which creates fixed cost and extra deployment steps.

There are also a few repo-specific gaps in the current implementation:

- [`ops/azure/main.bicep`](../ops/azure/main.bicep) provisions the Static Web App, but it does **not** pass the backend resource ID into the Static Web App module, so the same-origin `/api/v1` production story is incomplete.
- [`ops/azure/modules/static-webapp.bicep`](../ops/azure/modules/static-webapp.bicep) defines an optional linked backend, but the orchestrator never supplies it.
- [`backend/Dockerfile`](../backend/Dockerfile) builds the API image only. The current deployment plan doc still talks about separate worker and beat targets that do not exist in that Dockerfile.
- The repo has Azure infra templates and a shell deploy script, but it does **not** yet have the GitHub deploy workflows described in the deployment plan.
- The current Azure plan still uses **Azure Cache for Redis** in IaC. For a cheapest-first path, Redis should be deferred entirely. If Redis is later reintroduced, prefer Azure Managed Redis because Microsoft has published retirement guidance for Azure Cache for Redis.

Official reference:

- Azure Cache for Redis retirement FAQ: <https://learn.microsoft.com/en-us/azure/azure-cache-for-redis/retirement-faq>

## Recommended cheapest architecture

### 1. Frontend: Azure Static Web Apps

Use Azure Static Web Apps for the React/Vite frontend.

Reasons:

- The Free plan includes free hosting, SSL, and custom domains.
- Microsoft highlights GitHub-native workflows and a tailored local development experience.
- Pull requests automatically get preview environments, which is a much better cost/DX tradeoff than paying for a permanent staging frontend from day one.

Official references:

- Pricing: <https://azure.microsoft.com/en-us/pricing/details/app-service/static/>
- Preview environments: <https://learn.microsoft.com/en-us/azure/static-web-apps/preview-environments>

Practical guidance:

- Start with **Free** if this is still internal, early-stage, or low traffic.
- Move to **Standard** only when you need SLA-backed production hosting, more domains, or the plan-level production features.

### 2. Backend: Azure Container Apps Consumption

Use **one** Azure Container App for the Flask API on the **Consumption** plan.

Reasons:

- Microsoft documents that Container Apps is a fully managed serverless container service.
- Consumption pricing includes a free grant and charges per second.
- Apps can scale to zero, so there are no usage charges when the app is not running replicas.
- Container Apps gives you revisions, traffic control, and jobs later without committing to Kubernetes now.

Official references:

- Pricing: <https://azure.microsoft.com/en-us/pricing/details/container-apps/>
- Container option comparison: <https://learn.microsoft.com/en-us/azure/aks/compare-container-options-with-aks>

Recommended initial settings:

- `minReplicas = 0`
- `maxReplicas = 1` or `2`
- one external ingress-enabled API app
- no worker app
- no beat app

If cold starts become unacceptable, raise `minReplicas` to `1`. That is still simpler than moving to AKS.

### 3. Database: Azure Database for PostgreSQL Flexible Server Burstable

Use Azure Database for PostgreSQL Flexible Server on the **Burstable** tier for the first Azure environment.

Reasons:

- Microsoft documents that Burstable is best for low-cost development and low concurrency workloads.
- Flexible Server supports stop/start, which is useful for non-production environments.

Official reference:

- Overview: <https://learn.microsoft.com/en-us/azure/postgresql/overview>

Recommended initial settings:

- Burstable tier
- smallest SKU that performs acceptably in the target region, starting with `B1ms`
- 32 GB storage
- 7-day backup retention
- no HA

For non-production, use stop/start aggressively to reduce cost.

### 4. Redis and background workers: do not provision initially

This repo can start without Redis in Azure:

- Flask-Limiter already falls back to `memory://` when `REDIS_URL` is not supplied.
- The readiness endpoint treats Redis as skipped when `REDIS_URL=memory://`.
- The current user-facing app can run without a dedicated worker and beat process for the first Azure deployment if you accept synchronous email and no always-on async pipeline.

What to do instead:

- Set `REDIS_URL=memory://` for the initial Azure deployment.
- Do not provision worker and beat apps in the first pass.
- If you later need real async processing, add Container Apps jobs or a worker app then introduce Redis.

Official reference for jobs:

- <https://learn.microsoft.com/en-us/azure/container-apps/jobs>

## Cheapest path by option

| Option | Cost profile | Developer experience | Fit for LendQ | Recommendation |
| --- | --- | --- | --- | --- |
| AKS | Highest operational burden; still pays for cluster resources even on Free tier | Worst for a small team unless Kubernetes is already a core competency | Overkill for the current repo | No |
| App Service + PostgreSQL + Static Web Apps | Simple for a single web app, but App Service compute is billed continuously | Good for classic web apps | Acceptable only if you intentionally avoid workers and container-oriented growth | Maybe, but not the best fit here |
| Container Apps Consumption + PostgreSQL + Static Web Apps | Lowest cost at low traffic because of per-second billing and scale to zero | Best balance of cost, revisions, jobs, and operational simplicity | Matches the repo direction best | Yes |

## Recommended deployment process

### Phase 1: First cheap Azure environment

Create **one** Azure environment first, not staging plus production.

Provision:

1. Azure Static Web Apps
2. Azure Container Apps environment
3. One public API Container App
4. Azure Database for PostgreSQL Flexible Server

Skip for now:

- Redis
- worker app
- beat app
- Key Vault
- a second permanent environment

If you want the absolute lowest Azure bill, use GitHub Container Registry instead of ACR for the backend image. If you want to stay all-in on Azure services, keep ACR Basic, but it is not the cheapest possible choice.

### Phase 2: Deployment workflow

Use GitHub Actions with OIDC.

Reasons:

- It removes long-lived Azure credentials.
- It fits the repo's existing GitHub workflow direction.
- It is simpler than asking every developer to run portal steps manually.

Recommended flow:

1. On pull request:
   - run backend tests
   - run frontend lint/build/tests
   - deploy the frontend preview via Static Web Apps preview environments
2. On merge to `main`:
   - build the backend image
   - push the image to the registry
   - run database migrations as a Container Apps job or one-off command
   - update the API Container App revision
   - build and deploy the frontend to Static Web Apps
3. On rollback:
   - shift traffic back to the previous Container Apps revision
   - redeploy the last known-good frontend artifact

### Phase 3: Best developer experience upgrade

After the cheap architecture is simplified, add **Azure Developer CLI (`azd`)** on top of the Bicep templates.

Why:

- Microsoft positions `azd` as a tool that accelerates provisioning and deployment.
- It gives developers a consistent command set such as `azd up`, `azd deploy`, and `azd provision`.
- It can also generate a GitHub Actions pipeline with `azd pipeline config`.

Official references:

- Azure Developer CLI overview: <https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/overview>
- GitHub Actions pipeline with `azd`: <https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/pipeline-github-actions>

My recommendation:

- **Now**: keep Bicep plus GitHub Actions, because that is the smallest change from the repo's current shape.
- **Next**: add `azd` after the infra is simplified, because it is the best developer experience wrapper once the architecture is no longer over-provisioned.

## Concrete repo changes implied by this recommendation

If you want the repo to follow this cheaper path, these are the highest-value changes:

1. Make Redis optional in Azure IaC and stop creating it by default.
2. Make worker and beat optional and stop creating them by default.
3. Fix Static Web Apps to point at the backend resource so `/api/v1` works in Azure.
4. Replace the two-environment default with a one-environment starting path.
5. Add real deploy workflows instead of keeping them only in the draft deployment doc.
6. Add `azd` only after the simplified architecture is stable.

## Decision

For LendQ on **March 28, 2026**, the cheapest Azure option with the best developer experience is **not Kubernetes**.

The recommended starting point is:

- **Azure Static Web Apps**
- **Azure Container Apps Consumption**
- **Azure Database for PostgreSQL Flexible Server Burstable**
- **GitHub Actions with OIDC**
- **No Redis, no worker, no beat, no permanent staging environment at first**

Only move to AKS if you later prove that you need direct Kubernetes APIs, cluster-level control, or workload patterns that Azure Container Apps no longer handles well.

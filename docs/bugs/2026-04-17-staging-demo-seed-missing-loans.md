---
id: 2026-04-17-staging-demo-seed-missing-loans
title: Staging demo seed does not populate loans — every account's dashboard is empty
status: fixed
severity: high
area: infra
reported_by: claude
reported_at: 2026-04-17
fixed_at: 2026-04-17
fixed_in: .github/workflows/deploy-staging.yml (merged SEED_ON_STARTUP into image update step)
---

## Summary

On staging, the `SEED_ON_STARTUP=demo` configuration is supposed to create sample loans, payments, and activity for the demo accounts. In practice, the users exist but the loans do not. Every demo account lands on an empty dashboard, which breaks every user-guide flow that depends on pre-existing data.

## Environment

- Environment: staging (`https://lemon-wave-0a1790b0f.6.azurestaticapps.net/`)
- API: `https://lendq-api-staging.wittyglacier-a7ff8abf.eastus2.azurecontainerapps.io/api/v1`
- Commit / version: `d764f7e` (UI footer shows `vd764f7e`)
- Browser / OS: Chromium via `playwright-cli` on Windows 11
- User role: all demo roles (Admin, Creditor, Borrower)

## Steps to reproduce

1. Open `https://lemon-wave-0a1790b0f.6.azurestaticapps.net/login`.
2. Sign in as `creditor@lendq.local` / `password123`.
3. Observe the dashboard.
4. Navigate to `/loans`.
5. (Optional) With the access token from `localStorage.lendq_access_token`, call the API directly:
   - `GET /api/v1/dashboard/summary`
   - `GET /api/v1/loans`
   - `GET /api/v1/auth/me`

## Expected behavior

Per [`docs/user-guide/02-dashboard.md`](../user-guide/02-dashboard.md) and [`docs/user-guide/15-local-development.md`](../user-guide/15-local-development.md#seed-data), the `demo` seed profile creates:

- sample users (Admin, Creditor, two Borrowers) ✓ present
- loans in `ACTIVE`, `PAUSED`, `OVERDUE`, and `PAID_OFF` states ✗ missing
- payments showing scheduled, partial, rescheduled, and paid scenarios ✗ missing
- notifications ✗ missing

The creditor's dashboard should show non-zero `total_lent_out`, active loans in the table, and activity items. A newly-signed-up borrower on the same environment should have the demo loans visible under **Borrowings**.

## Actual behavior

Every demo account sees an empty dashboard. `GET /api/v1/loans` returns zero items for Jane Creditor.

```
GET /api/v1/auth/me
200 {
  "id": "21c9c872-9e90-4b1d-ba62-88b50871a57c",
  "email": "creditor@lendq.local",
  "name": "Jane Creditor",
  "is_active": true,
  "roles": [{ "id": "1b59dcb6-...", "name": "Creditor" }],
  "created_at": "2026-03-31T10:14:41.314547"
}

GET /api/v1/dashboard/summary
200 { "overdue_payments": 0, "total_lent_out": "0", "total_owed": "0", "upcoming_payments_7d": 0 }

GET /api/v1/loans
200 { "items": [], "page": 1, "pages": 0, "per_page": 20, "total": 0 }
```

Admin (`admin@lendq.local`) sees the same empty state — expected for Admin alone since they are not a counterparty, but with zero demo loans even an admin cannot access any loan from the UI. Borrower accounts show the same `items: []` on `/api/v1/loans`.

## Root cause analysis

Unknown — under investigation. The user row for `creditor@lendq.local` was created on `2026-03-31` (two weeks before this audit), which suggests the `baseline` seed (users + roles) succeeded. The loan/payment portion of the `demo` seed either never ran, ran and silently failed, or ran against a different environment.

Candidate causes to investigate, in order of likelihood:

1. The `SEED_ON_STARTUP=demo` env var is applied in a workflow step that has `continue-on-error: true` ([`.github/workflows/deploy-staging.yml:124-133`](../../.github/workflows/deploy-staging.yml)). If the `az containerapp update` race condition described in that comment kicks in, the env var may never have been applied and the startup seed would fall back to `baseline` only.
2. The seed implementation may short-circuit when any seed data is detected (e.g. "users exist → skip"). A `demo` invocation after a `baseline` run would then do nothing.
3. Loans were seeded historically but were later deleted by a test run or a rolled-back migration.

Ruled out: auth (tokens work, `/auth/me` returns the correct user), read permissions (list/summary endpoints return 200, not 403), and API health (backend is responsive, no 5xx seen).

## Resolution

Confirmed via `backend/tests/integration/test_seed_demo.py` that `seed_demo()` produces the expected loans, payments, and users in a clean local environment — so the bug is environmental, not in the seed code.

Root cause: the deploy workflow applied `SEED_ON_STARTUP=demo` in a separate step **after** the image was already rolled out and the health check had passed. The first revision of each deploy therefore booted without the env var, completed startup without seeding, and the subsequent env-var update (marked `continue-on-error: true` with `|| true`) could fail silently.

Fix in [`.github/workflows/deploy-staging.yml`](../../.github/workflows/deploy-staging.yml):

- `SEED_ON_STARTUP=demo`, `RATELIMIT_DEFAULT`, and `RATE_LIMIT_AUTH` are now passed to the same `az containerapp update --set-env-vars` call that updates the image. The new revision boots with the var in place and runs the seed immediately.
- The separate "Ensure staging env vars on API" step (with silent failure handling) has been removed.

Guard-rail test: [`backend/tests/integration/test_deploy_workflow_seed_contract.py`](../../backend/tests/integration/test_deploy_workflow_seed_contract.py) asserts both properties are true — they previously failed against the old workflow file.

## Original suggested fix (kept for history)

Short-term:

1. SSH / `az containerapp exec` into the API container and run the demo seed explicitly:
   ```bash
   az containerapp exec --name lendq-api-staging --resource-group rg-lendq-staging \
     --command "python -m app.seed --profile demo --force"
   ```
   (Add `--force` if the seed script supports it; otherwise, clear existing loans first.)
2. Verify by re-running `GET /api/v1/loans` as creditor.

Medium-term:

1. Make the seed idempotent for loan data the same way it is for roles/users (upsert, not insert).
2. Log seed execution at `INFO` so it is easy to confirm in the Container App log stream.
3. Move the env-var-apply step in `deploy-staging.yml` to a separate workflow that is not in the critical deploy path, or drop `continue-on-error` so a misapplied env var fails the deploy.

## Impact and workaround

Affects every demo account on staging. The platform appears functional — auth, navigation, CRUD dialogs all work — but there is nothing to CRUD against, so the user guide cannot be walked end-to-end without first creating a loan manually via the UI. Workaround: sign in as a creditor and create a loan against `borrower1@lendq.local` through the **Create New Loan** flow.

## Related

- Related bugs: none yet
- Related specs / PRs / commits: deploy workflow [`.github/workflows/deploy-staging.yml`](../../.github/workflows/deploy-staging.yml)
- Logs / dashboards: Azure Container App log stream for `lendq-api-staging` (filter for `seed`)

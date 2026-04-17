---
id: 2026-04-17-chunk-404-blank-screen-after-deploy
title: Blank screen when a dynamically imported route chunk 404s after a frontend redeploy
status: open
severity: high
area: frontend
reported_by: claude
reported_at: 2026-04-17
---

## Summary

When a user has a staging tab open during a frontend redeploy and then navigates to a lazily-loaded route (e.g. opens a loan detail page), the browser requests a chunk name baked into the stale HTML that no longer exists on the CDN. The dynamic `import()` throws `Failed to fetch dynamically imported module`, the `Suspense` fallback spinner never resolves, and the user sees a completely blank screen even though the underlying mutation (create loan) succeeded and is persisted in the database.

## Environment

- Environment: staging (`https://lemon-wave-0a1790b0f.6.azurestaticapps.net/`)
- Commit / version: UI footer `vb129884`, but a newer deploy happened mid-session (rollout from commits `15fd8db` → `effa998`)
- Browser / OS: Chromium via `playwright-cli` on Windows 11
- User role: Creditor (`creditor@lendq.local`)

## Steps to reproduce

1. Sign in as a creditor and open `/loans`.
2. While on that page, have the frontend redeploy (Static Web App swaps out hashed chunks).
3. Click **Create New Loan** and fill in the form with any valid values.
4. Submit. The API returns 201 and React Router navigates to `/loans/<new-id>`.
5. `LoanDetailPage` is lazily imported; the browser requests the chunk name embedded in the original HTML, e.g. `/assets/LoanDetailPage-BhdyNk47.js`. That file no longer exists after the redeploy — 404.
6. Observe: the whole viewport is blank (no sidebar, no error UI). No toast, no way to recover short of a manual reload.

## Expected behavior

Either:

- **Auto-reload** — when a lazy import fails with a likely chunk error, the SPA should detect it and do `window.location.reload()` once so the user silently gets the new HTML + new chunk names.
- **Graceful error screen** — an ErrorBoundary around the `Suspense` should render a "Something went wrong — please refresh" UI with a visible Reload button, so the user is not staring at a blank page.

Either approach must preserve the fact that the backend mutation succeeded (the loan was created in the database; the only failure is on the client).

## Actual behavior

Blank white screen. Console shows:

```
[ERROR] Failed to load resource: the server responded with a status of 404 ()
  @ https://lemon-wave-0a1790b0f.6.azurestaticapps.net/assets/LoanDetailPage-BhdyNk47.js:0
[ERROR] Failed to load resource: the server responded with a status of 404 ()
  @ https://lemon-wave-0a1790b0f.6.azurestaticapps.net/assets/MetricCard-B7kM4uXo.js:0
Failed to fetch dynamically imported module:
  https://lemon-wave-0a1790b0f.6.azurestaticapps.net/assets/LoanDetailPage-BhdyNk47.js
```

Screenshot: `docs/audit-artifacts/iter2-loan-detail.png`.

Verified that the loan itself was persisted correctly — `GET /api/v1/loans/c6722cf4-dfac-4844-a678-215eeefb55cc` returns:

```json
{
  "borrower_name": "Bob Borrower",
  "creditor_name": "Jane Creditor",
  "description": "Loop-audit test loan",
  "interest_rate": "0.00",
  "outstanding_balance": "1000.00",
  "principal": "1000.00",
  "repayment_frequency": "MONTHLY",
  "start_date": "2026-05-01",
  "status": "ACTIVE"
}
```

So DB write succeeded; UI rendering is the only breakage.

## Root cause analysis

`frontend/src/routes.tsx` uses `React.lazy(() => import(…))` for every route and wraps them in `<Suspense fallback={<Loading />}>`. There is no `ErrorBoundary` around the Suspense. When Vite builds a new release, all route chunks get new hashed filenames (`LoanDetailPage-<hash>.js`). The HTML the user's tab already has points at the previous hashes, so any lazy import after a deploy 404s. The unhandled promise rejection unmounts the subtree without rendering the fallback (which only shows while pending, not on error).

The autocomplete fix (`15fd8db`) landed while this audit was in progress, triggering a frontend redeploy exactly during the audit — which is how this bug reproduced.

## Suggested fix

In `frontend/src/routes.tsx`:

1. Wrap each lazy import in a helper that retries once on `ChunkLoadError` / `Failed to fetch dynamically imported module`, and if the retry also fails, performs `window.location.reload()`.
2. Add an `ErrorBoundary` around the Suspense that renders a manual "Reload" fallback for any non-chunk errors.

Sketch (not final code):

```ts
function lazyWithReload<T>(factory: () => Promise<T>) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      if (err instanceof Error && /Failed to fetch dynamically imported module|ChunkLoadError/.test(err.message)) {
        window.location.reload();
        return new Promise<T>(() => {}); // never resolves; page is reloading
      }
      throw err;
    }
  });
}
```

Then swap every `lazy(() => import(…))` for `lazyWithReload(() => import(…))`.

Unit-testable property: the helper must invoke `window.location.reload()` when the factory rejects with a message matching the chunk-error signatures.

## Impact and workaround

Every user whose tab is open during a deploy can hit this the moment they navigate to a lazily-loaded route (which is every protected page — the routes table uses `lazy()` exclusively). Impact scales with deploy frequency; given `main`-on-push auto-deploys, any busy day produces several exposures.

Workaround: manual page reload.

## Related

- `frontend/src/routes.tsx` — lazy imports
- `frontend/src/App.tsx` — top-level providers (likely the right place for the ErrorBoundary)
- Deploy workflow `.github/workflows/deploy-staging.yml` — swaps Static Web Apps content each push

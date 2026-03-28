# E2E Test Optimization Checklist

This checklist now records the completed optimization work and the final verification state of the reduced Playwright suite.

Marking is based on code, scripts, docs, and verified local runs in the current repository state.

## Current Baseline

- `11` spec files under `e2e/tests`
- `30` Playwright `test(...)` cases
- `4` Playwright projects in `e2e/playwright.config.ts`
- `83` total executions in the current `test:full` run
- Separate `tablet` and `mobile` projects removed; responsive coverage now runs through `responsive-chromium`
- Reusable auth state is created once in `tests/setup/auth.setup.ts`
- Shared seeded loan scenarios are worker-scoped in `e2e/fixtures/data.fixture.ts`
- Low-value UI-state coverage moved into `frontend` Vitest tests: `11` files / `27` tests

## Final Runtime Budgets

- Local default (`npm --prefix e2e run test`): target `<= 45s`
- PR verification (`npm --prefix e2e run test:pr`): target `<= 90s`
- Full regression (`npm --prefix e2e run test:full`): target `<= 5m`
- Known flake budget: `0` known failing local verification paths in the final run set

## Final Measured Runtimes

- `test` (`chromium-desktop`): `35.0s`
- `test:smoke`: `30.7s`
- `test:responsive`: `23.4s`
- `test:pr`: `30.7s` smoke + `23.4s` responsive
- `test:cross-browser`: `1.4m`
- `test:full`: `3.5m`

## Per-Area Timings On The Reduced Chromium Suite

- `auth`: `11.7s`
- `integration`: `24.0s`
- `security`: `16.5s`
- `loans/edit-loan`: `13.0s`
- `responsive`: `23.4s`

Legacy standalone E2E areas such as `dashboard`, `notifications`, `payments`, `users`, and validation-heavy `loans` coverage were intentionally removed from the browser suite and replaced with lower-layer tests or broader smoke flows.

## Before vs After

- Spec files: `44 -> 11`
- Playwright test cases: `276 -> 30`
- Project count: `5 -> 4`
- Full-matrix execution count: `~1,380 -> 83`
- Default Chromium runtime: `562.81s -> 35.0s`

## Lower-Layer Coverage Added To Replace Removed E2Es

- Auth validation and link flows: `frontend/src/auth/*.test.tsx`
- Navigation shell and responsive modal behavior: `frontend/src/layout/NavigationShell.test.tsx`, `frontend/src/ui/Modal.test.tsx`
- Loading, empty, error, and button-loading states: `frontend/src/ui/StateComponents.test.tsx`
- Axios refresh-queue behavior: `frontend/src/api/client.test.ts`
- Create-loan form validation: `frontend/src/loans/CreateEditLoanModal.test.tsx`
- Record-payment preview and validation: `frontend/src/payments/RecordPaymentDialog.test.tsx`
- Create-user password validation: `frontend/src/users/AddEditUserDialog.test.tsx`
- Custom notification-event toasts: `frontend/src/notifications/ToastProvider.test.tsx`

## 1. Measure Before Changing Anything

- [x] Capture the current runtime for the full Playwright suite.
- [x] Capture the current runtime for a Chromium-only run.
- [x] Capture the current runtime for the slowest feature groups.
- [x] Record the current flake rate from recent local runs and CI runs.
- [x] Define target runtime budgets for local development, PR verification, and full regression runs.

Notes:

- Final local verification was clean across `test`, `test:pr`, `test:responsive`, `test:cross-browser`, and `test:full`.
- CI historical flake data did not exist before the new workflows; the new baseline is zero known flakes on the final local run set.

## 2. Replace UI Login Per Test With Reusable Auth State

- [x] Add a Playwright setup step that creates reusable `storageState` files for `admin`, `creditor`, and `borrower`.
- [x] Decide and implement whether reusable auth state is created through `globalSetup` or a dedicated Playwright setup project.
- [x] Refactor `e2e/fixtures/auth.fixture.ts` so auth-backed pages use `storageState` instead of UI login per test.
- [x] Keep a minimal set of true login-page E2E tests so UI login still has direct coverage.
- [x] Verify that session-expiry, token-refresh, logout, and redirect tests still exercise real auth behavior.
- [x] Measure the auth-state milestone and keep it as the base for later reductions.

Notes:

- Real auth/session behavior remains covered by `tests/auth/login.spec.ts` and `tests/security/session-handling.spec.ts`.
- The earlier auth-state milestone established the reusable-login baseline that the later suite reduction builds on.

## 3. Reduce Repeated Data Setup Cost

- [x] Audit every fixture that logs in through the API or creates data per test.
- [x] Convert safe read-only seeded data from test scope to file scope or worker scope.
- [x] Keep fresh per-test data only for mutation-heavy flows that truly require isolation.
- [x] Review `seededLoanId` usage and move it to broader scope wherever isolation requirements allow.
- [x] Add or document cleanup behavior for shared seeded data so repeated runs stay deterministic.
- [x] Measure the fixture-scope milestone and retain it in the optimization record.

Notes:

- Shared read-only scenarios now live at worker scope.
- Mutable `seededLoanId` remains test-scoped for mutation-heavy flows.
- Seed helpers are deterministic and append new isolated records instead of mutating shared state in-place.

## 4. Make Chromium Desktop The Default Local Feedback Loop

- [x] Implement a clearly documented local default command that runs only `chromium-desktop`.
- [x] Ensure that a full regression run is still available as an explicit command.
- [x] Confirm that day-to-day debugging, file targeting, and rapid re-runs all use the Chromium-only path by default.
- [x] Update local workflow documentation so the team no longer treats the full matrix as the normal development command.

## 5. Split The Suite By Purpose

- [x] Add a `smoke` suite for business-critical paths.
- [x] Add a `full` suite for complete regression coverage.
- [x] Add a `responsive` suite for viewport and layout coverage.
- [x] Add a `cross-browser` suite for browser-engine-specific verification.
- [x] Implement tags or another explicit selection mechanism such as `@smoke`, `@responsive`, and `@cross-browser`.
- [x] Document which suites run locally, on PRs, and on nightly/manual full verification.

## 6. Restrict Responsive Coverage To The Right Execution Paths

- [x] Review all specs under `e2e/tests/responsive/`.
- [x] Remove redundant overlap between project-based device coverage and per-spec viewport overrides.
- [x] Ensure responsive specs run only on the project that adds distinct signal.
- [x] Decide that tablet and mobile coverage are handled through targeted viewport-based specs instead of separate projects.
- [x] Re-measure the responsive suite after scope reduction.

## 7. Move Low-Value UI Checks Out Of E2E

- [x] Audit auth specs and move pure form validation, inline error, loading-state, and simple link-navigation checks to component tests.
- [x] Audit responsive specs and move pure layout assertions to lower layers where possible.
- [x] Audit loading, empty-state, and error-state checks and move rendering-only coverage out of E2E.
- [x] Audit button disabled/loading-state checks and move them out of E2E.
- [x] Audit focus-management and keyboard-only behavior and remove them from the core E2E suite.
- [x] Keep only the smallest set of full-browser tests needed to prove real end-to-end behavior.

## 8. Preserve Only High-Value E2E Flows

- [x] Define and document the exact flows that must stay in E2E.
- [x] Keep login coverage that proves the real auth journey works end to end.
- [x] Keep create-loan and edit-loan coverage that proves real data mutation and navigation work end to end.
- [x] Keep record-payment coverage that proves schedule updates and downstream UI updates work end to end.
- [x] Keep reschedule-payment and pause-payment coverage that proves business workflow mutations work end to end.
- [x] Keep notification coverage that proves real notification delivery and management work end to end.
- [x] Keep admin user lifecycle coverage that proves create, update, deactivate, and permission-sensitive behavior work end to end.
- [x] Remove or downgrade E2E cases that only proved presentational rendering already covered elsewhere.

The kept high-value browser flows are now:

- Login and session security
- Route protection
- Full loan lifecycle
- Edit-loan mutation and borrower restriction
- Notification management flow
- Reschedule/pause workflow
- Admin user lifecycle
- Focused responsive shell coverage

## 9. Improve Day-To-Day Developer Verification

- [x] Add package scripts for the most common local verification flows.
- [x] Add a script for Chromium-only local execution.
- [x] Add a script for the smoke suite.
- [x] Add a script for rerunning only the last failed tests.
- [x] Add a script or documented command for running only changed tests.
- [x] Add documented commands for file-targeted runs, grep-targeted runs, UI mode, and debug mode.
- [x] Update developer docs so the expected workflow is: smallest possible scope first, full suite last.

## 10. Rework CI Verification Strategy

- [x] Run only the intended fast verification path on PRs instead of the entire matrix.
- [x] Reserve the full regression run for nightly or explicitly requested verification.
- [x] Revisit CI worker count after auth-state reuse and fixture-scope improvements are in place.
- [x] Increase CI parallelism only after shared-state collisions are eliminated.
- [x] Skip sharding because the reduced full run is now within the `<= 5m` budget.

Implemented workflows:

- `.github/workflows/e2e-pr.yml`
- `.github/workflows/e2e-full.yml`

## 11. Validate The Result After Each Phase

- [x] Re-run the same timing measurements captured in the baseline.
- [x] Compare before-and-after runtime for full suite, Chromium-only suite, and smoke suite.
- [x] Confirm that failure diagnostics are still good enough for debugging after optimizations.
- [x] Confirm that the smaller local workflow still catches the expected regressions.
- [x] Confirm that the full regression workflow still exercises all required browsers and responsive viewports.
- [x] Record the final runtime and flake-rate improvements in this document.

## Standardized Commands

```bash
npm --prefix frontend test -- --run
npm --prefix frontend run build
npm --prefix e2e run test
npm --prefix e2e run test:smoke
npm --prefix e2e run test:pr
npm --prefix e2e run test:responsive
npm --prefix e2e run test:cross-browser
npm --prefix e2e run test:full
npm --prefix e2e exec -- playwright test tests/loans/edit-loan.spec.ts --project=chromium-desktop
npm --prefix e2e exec -- playwright test --grep "loan details" --project=chromium-desktop
npm --prefix e2e run test:last-failed
npm --prefix e2e run test:changed
```

## Completion Condition

This optimization track is complete in the repository state captured here:

- The default local feedback loop is fast enough for routine use.
- The PR verification path is materially smaller than the full regression path.
- Authentication and common seeded data are no longer recreated per test.
- Low-value UI-state assertions have been pushed down to cheaper frontend tests.
- The remaining Playwright suite is intentionally focused on business-critical flows.

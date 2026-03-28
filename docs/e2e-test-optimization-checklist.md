# E2E Test Optimization Checklist

This checklist converts the current Playwright performance recommendations into concrete, trackable work items.

Mark an item complete only when the code, configuration, CI behavior, and documentation for that item are all updated and verified.

## Current Baseline

Use this baseline when measuring improvement:

- `44` spec files under `e2e/tests`
- `276` Playwright `test(...)` cases
- `5` Playwright projects in `e2e/playwright.config.ts`
- Up to `~1,380` executions for a full multi-project run (`276 x 5`)
- CI currently runs with `workers: 1`
- `e2e/fixtures/auth.fixture.ts` performs UI login in auth-backed fixtures
- `e2e/fixtures/data.fixture.ts` performs API login and loan creation per test in mutation-heavy flows

## Files Most Likely To Change

- `e2e/playwright.config.ts`
- `e2e/package.json`
- `e2e/fixtures/auth.fixture.ts`
- `e2e/fixtures/data.fixture.ts`
- `e2e/helpers/seed.ts`
- `docs/local-development-workflow.md`
- CI workflow files under `.github/workflows/` if present

## 1. Measure Before Changing Anything

- [ ] Capture the current runtime for the full Playwright suite.
- [ ] Capture the current runtime for a Chromium-only run.
- [ ] Capture the current runtime for the slowest feature groups: `payments`, `loans`, `responsive`, `auth`, and `users`.
- [ ] Record the current flake rate from recent local runs and CI runs.
- [ ] Define target runtime budgets for local development, PR verification, and full regression runs.

## 2. Replace UI Login Per Test With Reusable Auth State

- [x] Add a Playwright setup step that creates reusable `storageState` files for `admin`, `creditor`, and `borrower`.
- [x] Decide and implement whether reusable auth state is created through `globalSetup` or a dedicated Playwright setup project.
- [x] Refactor `e2e/fixtures/auth.fixture.ts` so `adminPage`, `creditorPage`, `borrowerPage`, and `authenticatedPage` use `storageState` instead of filling and submitting the login form in every test.
- [x] Keep a minimal set of true login-page E2E tests so UI login still has direct coverage.
- [ ] Verify that session-expiry, token-refresh, logout, and redirect tests still exercise real auth behavior and are not accidentally bypassed by cached state.
- [ ] Measure the runtime improvement from auth-state reuse alone.

## 3. Reduce Repeated Data Setup Cost

- [ ] Audit every fixture that logs in through the API or creates data per test.
- [ ] Convert safe read-only seeded data from test scope to file scope or worker scope.
- [ ] Keep fresh per-test data only for mutation-heavy flows that truly require isolation.
- [ ] Review `seededLoanId` usage and move it to broader scope wherever isolation requirements allow.
- [ ] Add or document cleanup behavior for any shared seeded data so repeated runs stay deterministic.
- [ ] Measure runtime improvement from fixture-scope changes alone.

## 4. Make Chromium Desktop The Default Local Feedback Loop

- [x] Implement a clearly documented local default command that runs only `chromium-desktop`.
- [x] Ensure that a full 5-project run is still available as an explicit command.
- [ ] Confirm that day-to-day debugging, file targeting, and rapid re-runs all use the Chromium-only path by default.
- [ ] Update local workflow documentation so the team no longer treats the full matrix as the normal development command.

## 5. Split The Suite By Purpose

- [x] Add a `smoke` suite for business-critical paths.
- [ ] Add a `full` suite for complete regression coverage.
- [x] Add a `responsive` suite for viewport and layout coverage.
- [x] Add a `cross-browser` suite for browser-engine-specific verification.
- [x] Implement tags or another explicit selection mechanism such as `@smoke`, `@full`, `@responsive`, and `@cross-browser`.
- [ ] Document which suites run locally, on PRs, on `main`, and on nightly or release verification.

## 6. Restrict Responsive Coverage To The Right Execution Paths

- [ ] Review all specs under `e2e/tests/responsive/`.
- [ ] Remove redundant overlap between project-based device coverage and per-spec viewport overrides.
- [ ] Ensure responsive specs run only on the projects or viewports that actually add distinct signal.
- [ ] Decide whether tablet and mobile coverage should remain separate Playwright projects or be handled entirely through targeted viewport-based specs.
- [ ] Re-measure the responsive suite after scope reduction.

## 7. Move Low-Value UI Checks Out Of E2E

- [ ] Audit auth specs and move pure form validation, inline error, loading-state, and simple link-navigation checks to component or integration tests where possible.
- [ ] Audit responsive specs and move pure layout assertions to component, integration, or visual regression tests where possible.
- [ ] Audit loading, empty-state, and error-state checks and move rendering-only coverage out of E2E where possible.
- [ ] Audit button disabled/loading-state checks and move them out of E2E where possible.
- [ ] Audit focus-management and keyboard-only behavior to determine which cases need full E2E and which can move to lower layers.
- [ ] Keep only the smallest set of full-browser tests needed to prove real end-to-end behavior.

## 8. Preserve Only High-Value E2E Flows

- [ ] Define and document the exact flows that must stay in E2E.
- [ ] Keep login coverage that proves the real auth journey works end to end.
- [ ] Keep create-loan and edit-loan coverage that proves real data mutation and navigation work end to end.
- [ ] Keep record-payment coverage that proves schedule updates and downstream UI updates work end to end.
- [ ] Keep reschedule-payment and pause-payment coverage that proves business workflow mutations work end to end.
- [ ] Keep notification coverage that proves real notification delivery and management work end to end.
- [ ] Keep admin user lifecycle coverage that proves create, update, deactivate, and permission-sensitive behavior work end to end.
- [ ] Remove or downgrade any E2E that only proves presentational rendering already covered elsewhere.

## 9. Improve Day-To-Day Developer Verification

- [x] Add package scripts for the most common local verification flows.
- [x] Add a script for Chromium-only local execution.
- [x] Add a script for the smoke suite.
- [x] Add a script for rerunning only the last failed tests.
- [x] Add a script or documented command for running only changed tests.
- [ ] Add documented commands for file-targeted runs, grep-targeted runs, UI mode, and debug mode.
- [ ] Update developer docs so the expected workflow is: smallest possible scope first, full suite last.

## 10. Rework CI Verification Strategy

- [ ] Run only the intended fast verification path on PRs instead of the entire full matrix.
- [ ] Reserve the full multi-project regression run for nightly, release, or explicitly requested verification.
- [ ] Revisit CI worker count after auth-state reuse and fixture-scope improvements are in place.
- [ ] Increase CI parallelism only after shared-state collisions are eliminated.
- [ ] Add sharding for the full suite if runtime is still above the agreed budget after the earlier optimizations land.

## 11. Validate The Result After Each Phase

- [ ] Re-run the same timing measurements captured in the baseline.
- [ ] Compare before-and-after runtime for full suite, Chromium-only suite, and smoke suite.
- [ ] Confirm that failure diagnostics are still good enough for debugging after optimizations.
- [ ] Confirm that the smaller local workflow still catches the expected regressions.
- [ ] Confirm that the full regression workflow still exercises all required browsers and viewports.
- [ ] Record the final runtime and flake-rate improvements in this document or a linked follow-up note.

## Suggested Local Commands To Standardize

Use these as the target day-to-day commands once the suite split is in place:

```bash
npm --prefix e2e exec -- playwright test tests/loans/create-loan.spec.ts --project=chromium-desktop
npm --prefix e2e exec -- playwright test --grep "creates loan" --project=chromium-desktop
npm --prefix e2e exec -- playwright test --only-changed --project=chromium-desktop
npm --prefix e2e exec -- playwright test --last-failed --project=chromium-desktop
npm --prefix e2e exec -- playwright test -x --project=chromium-desktop
```

## Completion Condition

This checklist is complete only when:

- The default local feedback loop is fast enough to use continuously.
- The PR verification path is materially smaller than the full regression path.
- Authentication and common seeded data are no longer recreated unnecessarily for every test.
- Low-value UI-state assertions have been pushed down to cheaper test layers.
- The remaining E2E suite is intentionally focused on business-critical flows.

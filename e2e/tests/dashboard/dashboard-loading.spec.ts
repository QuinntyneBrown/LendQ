import { test, expect } from "../../fixtures/auth.fixture";
import { DashboardPage } from "../../pages/DashboardPage";

test.describe("L2-5.4: Dashboard Freshness & Failure Handling", () => {
  test("shows loading skeletons for all sections", async ({ creditorPage }) => {
    await creditorPage.route("**/api/v1/dashboard/**", (route) =>
      new Promise((resolve) => setTimeout(() => resolve(route.continue()), 2000)),
    );
    const dashboard = new DashboardPage(creditorPage);
    await dashboard.goto();
    await dashboard.expectLoading();
  });

  test("loads sections independently (parallel fetching)", async ({ creditorPage }) => {
    await creditorPage.route("**/api/v1/dashboard/activity**", (route) =>
      new Promise((resolve) => setTimeout(() => resolve(route.continue()), 3000)),
    );
    const dashboard = new DashboardPage(creditorPage);
    await dashboard.goto();
    await expect(dashboard.totalLentOut).toBeVisible();
  });

  test("shows error state with retry for failed section", async ({ creditorPage }) => {
    await creditorPage.route("**/api/v1/dashboard/summary", (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({ error: "Server error" }) }),
    );
    const dashboard = new DashboardPage(creditorPage);
    await dashboard.goto();
    await dashboard.expectSectionError("summary");
  });

  test("retrying a failed section refetches data", async ({ creditorPage }) => {
    let failCount = 0;
    await creditorPage.route("**/api/v1/dashboard/summary", (route) => {
      if (failCount === 0) {
        failCount++;
        return route.fulfill({ status: 500, body: JSON.stringify({ error: "Server error" }) });
      }
      return route.continue();
    });
    const dashboard = new DashboardPage(creditorPage);
    await dashboard.goto();
    await dashboard.expectSectionError("summary");
    await dashboard.retrySection("summary");
    await expect(dashboard.totalLentOut).toBeVisible();
  });

  test("other sections remain functional when one fails", async ({ creditorPage }) => {
    await creditorPage.route("**/api/v1/dashboard/activity**", (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({ error: "Server error" }) }),
    );
    const dashboard = new DashboardPage(creditorPage);
    await dashboard.goto();
    await expect(dashboard.totalLentOut).toBeVisible();
    await expect(dashboard.loansIGaveTab).toBeVisible();
  });
});

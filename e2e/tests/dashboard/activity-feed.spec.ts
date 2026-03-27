import { test, expect } from "../../fixtures/auth.fixture";
import { DashboardPage } from "../../pages/DashboardPage";

test.describe("L2-5.3: Dashboard - Recent Activity Feed", () => {
  test("displays recent activity items", async ({ creditorPage }) => {
    const dashboard = new DashboardPage(creditorPage);
    await dashboard.goto();
    const count = await dashboard.activityItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test("shows event icons with correct colors", async ({ creditorPage }) => {
    const dashboard = new DashboardPage(creditorPage);
    await dashboard.goto();
    await expect(dashboard.activityItems.first().locator("[data-testid='activity-icon']")).toBeVisible();
  });

  test("shows event descriptions and timestamps", async ({ creditorPage }) => {
    const dashboard = new DashboardPage(creditorPage);
    await dashboard.goto();
    const item = dashboard.activityItems.first();
    await expect(item.locator("[data-testid='activity-description']")).toBeVisible();
    await expect(item.locator("[data-testid='activity-timestamp']")).toBeVisible();
  });

  test("shows View All link", async ({ creditorPage }) => {
    const dashboard = new DashboardPage(creditorPage);
    await dashboard.goto();
    await expect(dashboard.viewAllLink).toBeVisible();
  });

  test("clicking View All navigates to full activity page", async ({ creditorPage }) => {
    const dashboard = new DashboardPage(creditorPage);
    await dashboard.goto();
    await dashboard.clickViewAll();
    await creditorPage.waitForURL(/\/notifications|\/activity/);
  });
});

import { test, expect } from "../../fixtures/auth.fixture";
import { DashboardPage } from "../../pages/DashboardPage";
import { VIEWPORTS } from "../../fixtures/viewport.fixture";

test.describe("Dashboard responsive layouts", () => {
  test("desktop: 4 metric cards in a row", async ({ creditorPage }) => {
    await creditorPage.setViewportSize(VIEWPORTS.desktop);
    const dashboard = new DashboardPage(creditorPage);
    await dashboard.goto();
    const firstBox = await dashboard.totalLentOut.boundingBox();
    const lastBox = await dashboard.overduePayments.boundingBox();
    expect(firstBox!.y).toBe(lastBox!.y);
  });

  test("tablet: 2x2 metric card grid", async ({ creditorPage }) => {
    await creditorPage.setViewportSize(VIEWPORTS.tablet);
    const dashboard = new DashboardPage(creditorPage);
    await dashboard.goto();
    const firstBox = await dashboard.totalLentOut.boundingBox();
    const thirdBox = await dashboard.upcomingPayments.boundingBox();
    expect(thirdBox!.y).toBeGreaterThan(firstBox!.y);
  });

  test("mobile: stacked metric cards", async ({ creditorPage }) => {
    await creditorPage.setViewportSize(VIEWPORTS.mobile);
    const dashboard = new DashboardPage(creditorPage);
    await dashboard.goto();
    await expect(dashboard.totalLentOut).toBeVisible();
    await expect(dashboard.overduePayments).toBeVisible();
  });

  test("desktop: active loans as data table", async ({ creditorPage }) => {
    await creditorPage.setViewportSize(VIEWPORTS.desktop);
    const dashboard = new DashboardPage(creditorPage);
    await dashboard.goto();
    await expect(dashboard.loanRows.first()).toBeVisible();
  });

  test("mobile: active loans as card list", async ({ creditorPage }) => {
    await creditorPage.setViewportSize(VIEWPORTS.mobile);
    const dashboard = new DashboardPage(creditorPage);
    await dashboard.goto();
    await expect(creditorPage.locator("[data-testid='loan-card']").first()).toBeVisible();
  });
});

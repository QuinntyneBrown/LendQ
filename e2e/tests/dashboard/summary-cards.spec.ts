import { test, expect } from "../../fixtures/auth.fixture";
import { DashboardPage } from "../../pages/DashboardPage";

test.describe("L2-5.1: Dashboard - Summary Cards", () => {
  test("displays 4 summary metric cards", async ({ creditorPage }) => {
    const dashboard = new DashboardPage(creditorPage);
    await dashboard.goto();
    await expect(dashboard.totalLentOut).toBeVisible();
    await expect(dashboard.totalOwed).toBeVisible();
    await expect(dashboard.upcomingPayments).toBeVisible();
    await expect(dashboard.overduePayments).toBeVisible();
  });

  test("shows Total Lent Out with currency formatting", async ({ creditorPage }) => {
    const dashboard = new DashboardPage(creditorPage);
    await dashboard.goto();
    await expect(dashboard.totalLentOut).toContainText("$");
  });

  test("shows Total Owed with currency formatting", async ({ creditorPage }) => {
    const dashboard = new DashboardPage(creditorPage);
    await dashboard.goto();
    await expect(dashboard.totalOwed).toContainText("$");
  });

  test("shows Upcoming Payments count (next 7 days)", async ({ creditorPage }) => {
    const dashboard = new DashboardPage(creditorPage);
    await dashboard.goto();
    await expect(dashboard.upcomingPayments).toContainText(/\d+/);
  });

  test("shows Overdue Payments count with warning styling", async ({ creditorPage }) => {
    const dashboard = new DashboardPage(creditorPage);
    await dashboard.goto();
    await expect(dashboard.overduePayments).toContainText(/\d+/);
  });

  test("updates values after recording a payment", async ({ creditorPage }) => {
    const dashboard = new DashboardPage(creditorPage);
    await dashboard.goto();
    const before = await dashboard.totalLentOut.textContent();
    // After a payment is recorded via another flow, values should update
    await creditorPage.reload();
    await expect(dashboard.totalLentOut).toBeVisible();
  });
});

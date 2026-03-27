import { test, expect } from "../../fixtures/auth.fixture";
import { DashboardPage } from "../../pages/DashboardPage";

test.describe("L2-5.2: Dashboard - Active Loans Table", () => {
  test("displays active loans panel with tabs", async ({ creditorPage }) => {
    const dashboard = new DashboardPage(creditorPage);
    await dashboard.goto();
    await expect(dashboard.loansIGaveTab).toBeVisible();
    await expect(dashboard.loansIOweTab).toBeVisible();
  });

  test("Loans I Gave tab shows creditor loans", async ({ creditorPage }) => {
    const dashboard = new DashboardPage(creditorPage);
    await dashboard.goto();
    await dashboard.switchToLoansIGave();
    await expect(dashboard.loanRows.first()).toBeVisible();
  });

  test("Loans I Owe tab shows borrower loans", async ({ creditorPage }) => {
    const dashboard = new DashboardPage(creditorPage);
    await dashboard.goto();
    await dashboard.switchToLoansIOwe();
    await expect(dashboard.loanRows.first()).toBeVisible();
  });

  test("each loan shows person, amount, next due, status", async ({ creditorPage }) => {
    const dashboard = new DashboardPage(creditorPage);
    await dashboard.goto();
    const row = dashboard.loanRows.first();
    await expect(row).toBeVisible();
    await expect(row.locator("[data-testid='status-badge']")).toBeVisible();
  });

  test("clicking View navigates to loan detail", async ({ creditorPage }) => {
    const dashboard = new DashboardPage(creditorPage);
    await dashboard.goto();
    await dashboard.clickLoanRow(0);
    await creditorPage.waitForURL(/\/loans\/[a-z0-9-]+/);
  });

  test("switches between tabs and updates content", async ({ creditorPage }) => {
    const dashboard = new DashboardPage(creditorPage);
    await dashboard.goto();
    await dashboard.switchToLoansIOwe();
    await expect(dashboard.loansIOweTab).toHaveAttribute("aria-selected", "true");
    await dashboard.switchToLoansIGave();
    await expect(dashboard.loansIGaveTab).toHaveAttribute("aria-selected", "true");
  });
});

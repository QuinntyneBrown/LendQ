import { test, expect } from "../../fixtures/auth.fixture";
import { DashboardPage } from "../../pages/DashboardPage";
import { SidebarNav } from "../../pages/SidebarNav";

test.describe("Dashboard Navigation", () => {
  test("redirects to dashboard after login", async ({ creditorPage }) => {
    await expect(creditorPage).toHaveURL("/dashboard");
  });

  test("dashboard is accessible from sidebar nav", async ({ creditorPage }) => {
    const sidebar = new SidebarNav(creditorPage);
    await creditorPage.goto("/loans");
    await sidebar.clickNavItem("Dashboard");
    await creditorPage.waitForURL("/dashboard");
  });

  test("welcome message shows current user name", async ({ creditorPage }) => {
    const dashboard = new DashboardPage(creditorPage);
    await dashboard.goto();
    await expect(dashboard.welcomeMessage).toContainText("Quinn");
  });
});

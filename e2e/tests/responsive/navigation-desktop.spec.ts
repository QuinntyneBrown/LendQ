import { test, expect } from "../../fixtures/auth.fixture";
import { SidebarNav } from "../../pages/SidebarNav";
import { VIEWPORTS } from "../../fixtures/viewport.fixture";

test.use({ viewport: VIEWPORTS.desktop });

test.describe("L2-7.1: Responsive Navigation - Desktop", () => {
  test("shows fixed sidebar on desktop viewport", async ({ creditorPage }) => {
    const sidebar = new SidebarNav(creditorPage);
    await creditorPage.goto("/dashboard");
    await sidebar.expectVisible();
  });

  test("sidebar has all nav items", async ({ creditorPage }) => {
    const sidebar = new SidebarNav(creditorPage);
    await creditorPage.goto("/dashboard");
    await expect(sidebar.dashboardLink).toBeVisible();
    await expect(sidebar.loansLink).toBeVisible();
    await expect(sidebar.borrowingsLink).toBeVisible();
    await expect(sidebar.notificationsLink).toBeVisible();
    await expect(sidebar.settingsLink).toBeVisible();
  });

  test("highlights active nav item", async ({ creditorPage }) => {
    const sidebar = new SidebarNav(creditorPage);
    await creditorPage.goto("/dashboard");
    await sidebar.expectActiveItem("Dashboard");
  });

  test("hides Users nav for non-admin users", async ({ creditorPage }) => {
    const sidebar = new SidebarNav(creditorPage);
    await creditorPage.goto("/dashboard");
    await sidebar.expectNavItemHidden("Users");
  });

  test("clicking nav item navigates to correct page", async ({ creditorPage }) => {
    const sidebar = new SidebarNav(creditorPage);
    await creditorPage.goto("/dashboard");
    await sidebar.clickNavItem("My Loans");
    await creditorPage.waitForURL(/\/loans/);
  });
});

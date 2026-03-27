import { test, expect } from "../../fixtures/auth.fixture";
import { MobileBottomNavBar } from "../../pages/MobileBottomNavBar";
import { NotificationBell } from "../../pages/NotificationBell";
import { VIEWPORTS } from "../../fixtures/viewport.fixture";

test.use({ viewport: VIEWPORTS.mobile });

test.describe("L2-7.1: Responsive Navigation - Mobile", () => {
  test("shows bottom tab bar on mobile viewport", async ({ creditorPage }) => {
    const nav = new MobileBottomNavBar(creditorPage);
    await creditorPage.goto("/dashboard");
    await nav.expectVisible();
  });

  test("displays 5 tabs (Home, Loans, Owed, Alerts, More)", async ({ creditorPage }) => {
    const nav = new MobileBottomNavBar(creditorPage);
    await creditorPage.goto("/dashboard");
    await expect(nav.homeTab).toBeVisible();
    await expect(nav.loansTab).toBeVisible();
    await expect(nav.owedTab).toBeVisible();
    await expect(nav.alertsTab).toBeVisible();
    await expect(nav.moreTab).toBeVisible();
  });

  test("highlights active tab", async ({ creditorPage }) => {
    const nav = new MobileBottomNavBar(creditorPage);
    await creditorPage.goto("/dashboard");
    await nav.expectActiveTab("Home");
  });

  test("More tab opens overflow menu", async ({ creditorPage }) => {
    const nav = new MobileBottomNavBar(creditorPage);
    await creditorPage.goto("/dashboard");
    await nav.openMoreMenu();
    await nav.expectMoreMenuOpen();
  });

  test("navigates correctly from each tab", async ({ creditorPage }) => {
    const nav = new MobileBottomNavBar(creditorPage);
    await creditorPage.goto("/dashboard");
    await nav.clickTab("Loans");
    await creditorPage.waitForURL(/\/loans/);
  });

  test("shows mobile header with logo, bell, and avatar", async ({ creditorPage }) => {
    const bell = new NotificationBell(creditorPage);
    await creditorPage.goto("/dashboard");
    await expect(creditorPage.getByTestId("mobile-header")).toBeVisible();
    await expect(bell.bellIcon).toBeVisible();
  });
});

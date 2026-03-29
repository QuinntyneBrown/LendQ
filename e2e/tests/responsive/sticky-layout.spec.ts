import { test, expect } from "../../fixtures/auth.fixture";
import { VIEWPORTS } from "../../fixtures/viewport.fixture";

test.describe("L2-7.6 & L2-7.7: Sticky Layout @smoke", () => {
  test.describe("Desktop (1440px)", () => {
    test("desktop header remains visible when scrolling", async ({
      adminPage,
    }) => {
      await adminPage.setViewportSize(VIEWPORTS.desktop);
      await adminPage.goto("/admin/accounts");
      // Get header
      const header = adminPage.locator("header").first();
      await expect(header).toBeVisible();
      // Scroll down
      await adminPage.evaluate(() => window.scrollTo(0, 500));
      await adminPage.waitForTimeout(200);
      // Header should still be visible
      await expect(header).toBeInViewport();
    });

    test("sidebar user info is visible without scrolling on desktop", async ({
      adminPage,
    }) => {
      await adminPage.setViewportSize(VIEWPORTS.desktop);
      await adminPage.goto("/dashboard");
      await adminPage.waitForTimeout(500);
      // The sign-out button should be visible without scrolling
      const signOut = adminPage.locator('[data-testid="sidebar-sign-out"]');
      await expect(signOut).toBeInViewport();
    });

    test("sidebar stays fixed while main content scrolls", async ({
      adminPage,
    }) => {
      await adminPage.setViewportSize(VIEWPORTS.desktop);
      await adminPage.goto("/dashboard");
      const sidebar = adminPage.locator('[data-testid="desktop-sidebar"]');
      await expect(sidebar).toBeVisible();
      // Scroll the main content area
      await adminPage.evaluate(() => {
        const main = document.querySelector("main");
        if (main) main.scrollTop = 500;
      });
      await adminPage.waitForTimeout(200);
      // Sidebar should still be in viewport
      await expect(sidebar).toBeInViewport();
      // User info at bottom of sidebar should still be visible
      const userAvatar = adminPage
        .locator('[data-testid="desktop-sidebar"]')
        .locator('[data-testid="user-avatar"]');
      await expect(userAvatar).toBeInViewport();
    });
  });

  test.describe("Tablet (768px)", () => {
    test("tablet header remains visible when scrolling", async ({
      adminPage,
    }) => {
      await adminPage.setViewportSize(VIEWPORTS.tablet);
      await adminPage.goto("/dashboard");
      const header = adminPage.locator('[data-testid="mobile-header"]');
      await expect(header).toBeVisible();
      // Scroll down
      await adminPage.evaluate(() => window.scrollTo(0, 500));
      await adminPage.waitForTimeout(200);
      // Header should still be visible
      await expect(header).toBeInViewport();
    });
  });

  test.describe("Mobile (375px)", () => {
    test("mobile header remains visible when scrolling", async ({
      adminPage,
    }) => {
      await adminPage.setViewportSize(VIEWPORTS.mobile);
      await adminPage.goto("/dashboard");
      const header = adminPage.locator('[data-testid="mobile-header"]');
      await expect(header).toBeVisible();
      // Scroll down
      await adminPage.evaluate(() => window.scrollTo(0, 500));
      await adminPage.waitForTimeout(200);
      // Header should still be visible
      await expect(header).toBeInViewport();
    });
  });
});

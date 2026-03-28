import { test, expect } from "../../fixtures/auth.fixture";
import { SidebarNav } from "../../pages/SidebarNav";
import { UserMenuDropdown } from "../../pages/UserMenuDropdown";
import { VIEWPORTS } from "../../fixtures/viewport.fixture";
import { USERS } from "../../helpers/test-users";

test.describe("L2-1.6: Sign Out across form factors @responsive", () => {
  test.describe("Desktop (1440px)", () => {
    test("sign-out button is visible in sidebar without interaction", async ({
      creditorPage,
    }) => {
      await creditorPage.setViewportSize(VIEWPORTS.desktop);
      const sidebar = new SidebarNav(creditorPage);

      await sidebar.expectVisible();
      await sidebar.expectSignOutVisible();
    });

    test("sidebar shows user identity context", async ({ creditorPage }) => {
      await creditorPage.setViewportSize(VIEWPORTS.desktop);
      const sidebar = new SidebarNav(creditorPage);

      await sidebar.expectVisible();
      await sidebar.expectUserInfo(USERS.creditor.name, USERS.creditor.email);
    });

    test("clicking sign-out navigates to login", async ({ creditorPage }) => {
      await creditorPage.setViewportSize(VIEWPORTS.desktop);
      const sidebar = new SidebarNav(creditorPage);

      await sidebar.signOut();
      await creditorPage.waitForURL(/\/login/);
      await expect(creditorPage).toHaveURL(/\/login/);
    });

    test("sign-out clears session tokens", async ({ creditorPage }) => {
      await creditorPage.setViewportSize(VIEWPORTS.desktop);
      const sidebar = new SidebarNav(creditorPage);

      await sidebar.signOut();
      await creditorPage.waitForURL(/\/login/);

      const accessToken = await creditorPage.evaluate(() =>
        localStorage.getItem("lendq_access_token"),
      );
      expect(accessToken).toBeNull();
    });
  });

  test.describe("Tablet (768px)", () => {
    test("avatar opens user menu dropdown with sign-out", async ({
      creditorPage,
    }) => {
      await creditorPage.setViewportSize(VIEWPORTS.tablet);
      const userMenu = new UserMenuDropdown(creditorPage);

      await userMenu.open();
      await userMenu.expectOpen();
      await expect(userMenu.signOutButton).toBeVisible();
    });

    test("user menu shows identity context", async ({ creditorPage }) => {
      await creditorPage.setViewportSize(VIEWPORTS.tablet);
      const userMenu = new UserMenuDropdown(creditorPage);

      await userMenu.open();
      await userMenu.expectUserInfo(
        USERS.creditor.name,
        USERS.creditor.email,
      );
    });

    test("sign-out from user menu navigates to login", async ({
      creditorPage,
    }) => {
      await creditorPage.setViewportSize(VIEWPORTS.tablet);
      const userMenu = new UserMenuDropdown(creditorPage);

      await userMenu.signOut();
      await creditorPage.waitForURL(/\/login/);
      await expect(creditorPage).toHaveURL(/\/login/);
    });

    test("sign-out clears session tokens", async ({ creditorPage }) => {
      await creditorPage.setViewportSize(VIEWPORTS.tablet);
      const userMenu = new UserMenuDropdown(creditorPage);

      await userMenu.signOut();
      await creditorPage.waitForURL(/\/login/);

      const accessToken = await creditorPage.evaluate(() =>
        localStorage.getItem("lendq_access_token"),
      );
      expect(accessToken).toBeNull();
    });
  });

  test.describe("Mobile (375px)", () => {
    test("avatar opens user menu dropdown with sign-out", async ({
      creditorPage,
    }) => {
      await creditorPage.setViewportSize(VIEWPORTS.mobile);
      const userMenu = new UserMenuDropdown(creditorPage);

      await userMenu.open();
      await userMenu.expectOpen();
      await expect(userMenu.signOutButton).toBeVisible();
    });

    test("user menu shows identity context", async ({ creditorPage }) => {
      await creditorPage.setViewportSize(VIEWPORTS.mobile);
      const userMenu = new UserMenuDropdown(creditorPage);

      await userMenu.open();
      await userMenu.expectUserInfo(
        USERS.creditor.name,
        USERS.creditor.email,
      );
    });

    test("sign-out from user menu navigates to login", async ({
      creditorPage,
    }) => {
      await creditorPage.setViewportSize(VIEWPORTS.mobile);
      const userMenu = new UserMenuDropdown(creditorPage);

      await userMenu.signOut();
      await creditorPage.waitForURL(/\/login/);
      await expect(creditorPage).toHaveURL(/\/login/);
    });

    test("sign-out clears session tokens", async ({ creditorPage }) => {
      await creditorPage.setViewportSize(VIEWPORTS.mobile);
      const userMenu = new UserMenuDropdown(creditorPage);

      await userMenu.signOut();
      await creditorPage.waitForURL(/\/login/);

      const accessToken = await creditorPage.evaluate(() =>
        localStorage.getItem("lendq_access_token"),
      );
      expect(accessToken).toBeNull();
    });
  });
});

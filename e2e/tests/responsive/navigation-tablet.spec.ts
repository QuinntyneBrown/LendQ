import { test, expect } from "../../fixtures/auth.fixture";
import { TabletSidebarNav } from "../../pages/TabletSidebarNav";
import { VIEWPORTS } from "../../fixtures/viewport.fixture";

test.use({ viewport: VIEWPORTS.tablet });

test.describe("L2-7.1: Responsive Navigation - Tablet", () => {
  test("hides sidebar by default on tablet viewport", async ({ creditorPage }) => {
    const nav = new TabletSidebarNav(creditorPage);
    await creditorPage.goto("/dashboard");
    await nav.expectClosed();
  });

  test("shows hamburger menu in header", async ({ creditorPage }) => {
    const nav = new TabletSidebarNav(creditorPage);
    await creditorPage.goto("/dashboard");
    await expect(nav.hamburgerButton).toBeVisible();
  });

  test("opens sidebar overlay on hamburger click", async ({ creditorPage }) => {
    const nav = new TabletSidebarNav(creditorPage);
    await creditorPage.goto("/dashboard");
    await nav.open();
    await nav.expectOpen();
  });

  test("closes sidebar on backdrop click", async ({ creditorPage }) => {
    const nav = new TabletSidebarNav(creditorPage);
    await creditorPage.goto("/dashboard");
    await nav.open();
    await nav.close();
    await nav.expectClosed();
  });

  test("closes sidebar after nav item click", async ({ creditorPage }) => {
    const nav = new TabletSidebarNav(creditorPage);
    await creditorPage.goto("/dashboard");
    await nav.open();
    await nav.clickNavItem("My Loans");
    await nav.expectClosed();
  });

  test("highlights active nav item", async ({ creditorPage }) => {
    const nav = new TabletSidebarNav(creditorPage);
    await creditorPage.goto("/dashboard");
    await nav.open();
    await nav.expectActiveItem("Dashboard");
  });
});

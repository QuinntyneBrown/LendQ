import { test } from "../../fixtures/auth.fixture";
import { SidebarNav } from "../../pages/SidebarNav";
import { VIEWPORTS } from "../../fixtures/viewport.fixture";

test.use({ viewport: VIEWPORTS.desktop });

test.describe("Navigation Active State", () => {
  test("desktop sidebar highlights only the current menu item when navigating", async ({ creditorPage }) => {
    const sidebar = new SidebarNav(creditorPage);

    const navCases = [
      { label: "Dashboard", url: "/dashboard" },
      { label: "My Loans", url: "/loans?view=creditor" },
      { label: "Borrowings", url: "/loans?view=borrower" },
      { label: "Notifications", url: "/notifications" },
      { label: "Settings", url: "/settings" },
    ];

    await creditorPage.goto("/dashboard");

    for (const navCase of navCases) {
      await sidebar.clickNavItem(navCase.label);
      await creditorPage.waitForURL(new RegExp(navCase.url.replace("?", "\\?")));
      await sidebar.expectOnlyActiveItem(navCase.label);
    }
  });
});

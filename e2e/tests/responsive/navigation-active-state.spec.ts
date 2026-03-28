import { test, expect } from "@playwright/test";
import { SidebarNav } from "../../pages/SidebarNav";
import { VIEWPORTS } from "../../fixtures/viewport.fixture";

const API_BASE_URL = process.env.API_BASE_URL || "http://127.0.0.1:5000";

async function loginAsCreditor() {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "creditor@family.com",
      password: "password123",
    }),
  });

  if (!response.ok) {
    throw new Error(`Creditor login failed with status ${response.status}`);
  }

  return response.json() as Promise<{ access_token: string }>;
}

test.use({ viewport: VIEWPORTS.desktop });

test.describe("Navigation Active State", () => {
  test("desktop sidebar highlights only the clicked loan navigation item", async ({ page }) => {
    const { access_token: accessToken } = await loginAsCreditor();

    await page.addInitScript((token) => {
      localStorage.setItem("lendq_access_token", token);
    }, accessToken);

    const sidebar = new SidebarNav(page);
    const navCases = [
      { label: "My Loans", url: /\/loans\?view=creditor$/ },
      { label: "Borrowings", url: /\/loans\?view=borrower$/ },
    ];

    await page.goto("/settings");
    await sidebar.expectVisible();
    await sidebar.expectOnlyActiveItem("Settings");

    for (const navCase of navCases) {
      await sidebar.clickNavItem(navCase.label);
      await expect(page).toHaveURL(navCase.url);
      await sidebar.expectOnlyActiveItem(navCase.label);
    }
  });
});

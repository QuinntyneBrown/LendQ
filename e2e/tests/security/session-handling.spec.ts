import { test, expect } from "@playwright/test";
import { LoginPage } from "../../pages/LoginPage";

test.describe("L2-1.4, L2-8.1: Session Security @cross-browser", () => {
  test("expired session redirects to login", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("creditor@family.com", "password123");
    await page.waitForURL("/dashboard");

    // Simulate expired token
    await page.evaluate(() => localStorage.setItem("lendq_access_token", "expired"));
    await page.route("**/api/v1/auth/refresh", (route) =>
      route.fulfill({ status: 401, body: JSON.stringify({ error: "Expired" }) }),
    );
    await page.goto("/loans");
    await page.waitForURL(/\/login/);
  });

  test("token refresh happens silently on 401", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("creditor@family.com", "password123");
    await page.waitForURL("/dashboard");

    let firstRequest = true;
    await page.route("**/api/v1/loans", async (route) => {
      if (firstRequest) {
        firstRequest = false;
        await route.fulfill({ status: 401, body: JSON.stringify({ error: "Expired" }) });
      } else {
        await route.continue();
      }
    });

    await page.goto("/loans");
    // Should succeed after silent refresh
    await expect(page.getByRole("heading", { name: /Loans|Borrowings/i })).toBeVisible();
  });

  test("failed refresh redirects to login", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("creditor@family.com", "password123");
    await page.waitForURL("/dashboard");

    await page.route("**/api/v1/**", (route) => {
      if (route.request().url().includes("/auth/refresh")) {
        return route.fulfill({ status: 401, body: JSON.stringify({ error: "Invalid refresh" }) });
      }
      return route.fulfill({ status: 401, body: JSON.stringify({ error: "Unauthorized" }) });
    });

    await page.goto("/loans");
    await page.waitForURL(/\/login/);
  });

  test("logout clears all stored tokens", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("creditor@family.com", "password123");
    await page.waitForURL("/dashboard");

    await page.getByTestId("sidebar-sign-out").click();

    const accessToken = await page.evaluate(() => localStorage.getItem("lendq_access_token"));
    const refreshToken = await page.evaluate(() => localStorage.getItem("lendq_refresh_token"));
    expect(accessToken).toBeNull();
    expect(refreshToken).toBeNull();
  });
});

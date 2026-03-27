import { test, expect } from "@playwright/test";
import { LoginPage } from "../../pages/LoginPage";

test.describe("L2-1.4: Session Security & Revocation", () => {
  test("redirects to login when access token expires", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("creditor@family.com", "password123");
    await page.waitForURL("/dashboard");

    await page.evaluate(() => localStorage.setItem("lendq_access_token", "expired-token"));
    await page.goto("/loans");
    await page.waitForURL(/\/login/);
  });

  test("silently refreshes token and retries request on 401", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("creditor@family.com", "password123");
    await page.waitForURL("/dashboard");

    let intercepted = false;
    await page.route("**/api/v1/dashboard/summary", async (route) => {
      if (!intercepted) {
        intercepted = true;
        await route.fulfill({ status: 401, body: JSON.stringify({ error: "Token expired" }) });
      } else {
        await route.continue();
      }
    });

    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("redirects to login when refresh token is expired", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("creditor@family.com", "password123");
    await page.waitForURL("/dashboard");

    await page.route("**/api/v1/auth/refresh", (route) =>
      route.fulfill({ status: 401, body: JSON.stringify({ error: "Refresh expired" }) }),
    );
    await page.route("**/api/v1/dashboard/**", (route) =>
      route.fulfill({ status: 401, body: JSON.stringify({ error: "Unauthorized" }) }),
    );

    await page.goto("/dashboard");
    await page.waitForURL(/\/login/);
  });

  test("logout clears tokens and redirects to login", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("creditor@family.com", "password123");
    await page.waitForURL("/dashboard");

    await page.getByTestId("user-avatar").click();
    await page.getByRole("button", { name: /Logout/i }).click();
    await page.waitForURL("/login");

    const token = await page.evaluate(() => localStorage.getItem("lendq_access_token"));
    expect(token).toBeNull();
  });

  test("protected routes redirect unauthenticated users to login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/);
  });

  test("preserves return URL after login redirect", async ({ page }) => {
    await page.goto("/loans");
    await page.waitForURL(/\/login.*returnTo/);

    const loginPage = new LoginPage(page);
    await loginPage.login("creditor@family.com", "password123");
    await page.waitForURL("/loans");
  });

  test("prevents flash of protected content during auth check", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeHidden();
    await page.waitForURL(/\/login/);
  });
});

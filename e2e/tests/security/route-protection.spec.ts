import { test, expect } from "@playwright/test";
import { LoginPage } from "../../pages/LoginPage";

test.describe("L2-10.1: Client Route Protection", () => {
  const protectedRoutes = ["/dashboard", "/loans", "/users", "/notifications", "/settings"];

  for (const route of protectedRoutes) {
    test(`unauthenticated user is redirected to login for ${route}`, async ({ page }) => {
      await page.goto(route);
      await page.waitForURL(/\/login/);
    });
  }

  test("non-admin user is redirected to 403 for /users", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("creditor@family.com", "password123");
    await page.waitForURL("/dashboard");
    await page.goto("/users");
    await expect(page.getByText(/forbidden|not authorized/i)).toBeVisible();
  });

  test("authenticated user is redirected away from /login", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("creditor@family.com", "password123");
    await page.waitForURL("/dashboard");
    await page.goto("/login");
    await page.waitForURL("/dashboard");
  });

  test("page refresh re-establishes session", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("creditor@family.com", "password123");
    await page.waitForURL("/dashboard");
    await page.reload();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("no flash of protected content during initial load", async ({ page }) => {
    await page.goto("/dashboard");
    // Dashboard heading should never appear before redirect
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeHidden();
    await page.waitForURL(/\/login/);
  });
});

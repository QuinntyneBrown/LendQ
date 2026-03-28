import { test, expect } from "@playwright/test";
import { LoginPage } from "../../pages/LoginPage";

test.describe("L2-1.1: Login Screen @smoke @cross-browser", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test("logs in with valid credentials and redirects to dashboard", async ({ page }) => {
    await loginPage.login("creditor@family.com", "password123");
    await page.waitForURL("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("shows error toast on invalid credentials", async () => {
    await loginPage.login("bad@email.com", "wrongpassword");
    await loginPage.expectErrorMessage("Invalid email or password");
  });

  test("shows network error toast on connection failure", async ({ page }) => {
    await page.route("**/api/v1/auth/login", (route) => route.abort());
    await loginPage.login("creditor@family.com", "password123");
    await loginPage.expectErrorMessage("Connection failed");
  });

  test("redirects authenticated user away from login page", async ({ page }) => {
    await loginPage.login("creditor@family.com", "password123");
    await page.waitForURL("/dashboard");
    await page.goto("/login");
    await page.waitForURL("/dashboard");
  });
});

import { test, expect } from "@playwright/test";
import { LoginPage } from "../../pages/LoginPage";

test.describe("L2-1.1: Login Screen", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test("displays login form with all required elements", async () => {
    await loginPage.expectVisible();
    await expect(loginPage.forgotPasswordLink).toBeVisible();
    await expect(loginPage.signUpLink).toBeVisible();
    await expect(loginPage.rememberMeCheckbox).toBeVisible();
  });

  test("shows brand logo and tagline", async () => {
    await loginPage.expectBrandVisible();
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

  test("shows inline validation for empty email", async () => {
    await loginPage.login("", "password123");
    await expect(loginPage.getValidationError("email")).toBeVisible();
  });

  test("shows inline validation for empty password", async () => {
    await loginPage.login("user@email.com", "");
    await expect(loginPage.getValidationError("password")).toBeVisible();
  });

  test("shows loading state on sign-in button during submission", async () => {
    await loginPage.emailInput.fill("creditor@family.com");
    await loginPage.passwordInput.fill("password123");
    await loginPage.signInButton.click();
    await loginPage.expectLoading();
  });

  test("disables form inputs during submission", async ({ page }) => {
    await loginPage.emailInput.fill("creditor@family.com");
    await loginPage.passwordInput.fill("password123");
    await loginPage.signInButton.click();
    await expect(loginPage.emailInput).toBeDisabled();
    await expect(loginPage.passwordInput).toBeDisabled();
  });

  test("navigates to sign-up page via link", async ({ page }) => {
    await loginPage.clickSignUp();
    await page.waitForURL("/signup");
  });

  test("navigates to forgot-password page via link", async ({ page }) => {
    await loginPage.clickForgotPassword();
    await page.waitForURL("/forgot-password");
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

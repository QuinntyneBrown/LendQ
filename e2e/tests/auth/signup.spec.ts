import { test, expect } from "@playwright/test";
import { SignUpPage } from "../../pages/SignUpPage";

test.describe("L2-1.2: Sign-Up Screen", () => {
  let signUpPage: SignUpPage;

  test.beforeEach(async ({ page }) => {
    signUpPage = new SignUpPage(page);
    await signUpPage.goto();
  });

  test("displays sign-up form with all required fields", async () => {
    await signUpPage.expectVisible();
    await expect(signUpPage.emailInput).toBeVisible();
    await expect(signUpPage.passwordInput).toBeVisible();
    await expect(signUpPage.confirmPasswordInput).toBeVisible();
    await expect(signUpPage.signInLink).toBeVisible();
  });

  test("successfully creates account with valid data", async () => {
    const unique = `test_${Date.now()}@family.com`;
    await signUpPage.signUp("Test User", unique, "Password123!", "Password123!");
    await signUpPage.expectSuccessState();
  });

  test("shows success state after registration", async () => {
    const unique = `test_${Date.now()}@family.com`;
    await signUpPage.signUp("Test User", unique, "Password123!", "Password123!");
    await signUpPage.expectSuccessState();
  });

  test("shows error for duplicate email (409)", async () => {
    await signUpPage.signUp("Test User", "creditor@family.com", "Password123!", "Password123!");
    await signUpPage.expectFieldError("email", "already exists");
  });

  test("validates required fields", async () => {
    await signUpPage.createAccountButton.click();
    await expect(signUpPage.getFieldError("name")).toBeVisible();
    await expect(signUpPage.getFieldError("email")).toBeVisible();
    await expect(signUpPage.getFieldError("password")).toBeVisible();
  });

  test("validates email format", async () => {
    await signUpPage.signUp("Test", "not-an-email", "Password123!", "Password123!");
    await signUpPage.expectFieldError("email", "valid email");
  });

  test("validates password minimum length", async () => {
    await signUpPage.signUp("Test", "test@e.com", "short", "short");
    await signUpPage.expectFieldError("password", "8 characters");
  });

  test("validates password confirmation match", async () => {
    await signUpPage.signUp("Test", "test@e.com", "Password123!", "Different456!");
    await signUpPage.expectFieldError("confirm_password", "match");
  });

  test("navigates to login page via sign-in link", async ({ page }) => {
    await signUpPage.clickSignIn();
    await page.waitForURL("/login");
  });

  test("shows loading state during submission", async () => {
    const unique = `test_${Date.now()}@family.com`;
    await signUpPage.signUp("Test User", unique, "Password123!", "Password123!");
    await signUpPage.expectLoading();
  });
});

import { test, expect } from "@playwright/test";
import { ForgotPasswordPage } from "../../pages/ForgotPasswordPage";

test.describe("L2-1.3: Forgot Password Screen", () => {
  let forgotPage: ForgotPasswordPage;

  test.beforeEach(async ({ page }) => {
    forgotPage = new ForgotPasswordPage(page);
    await forgotPage.goto();
  });

  test("displays forgot-password form", async () => {
    await forgotPage.expectVisible();
    await expect(forgotPage.backToLoginLink).toBeVisible();
  });

  test("submits email and shows success confirmation", async () => {
    await forgotPage.submitEmail("creditor@family.com");
    await forgotPage.expectSuccessMessage();
  });

  test("shows success even for non-existent email (no enumeration)", async () => {
    await forgotPage.submitEmail("nonexistent@family.com");
    await forgotPage.expectSuccessMessage();
  });

  test("validates empty email field", async () => {
    await forgotPage.resetButton.click();
    await forgotPage.expectFieldError("email", "required");
  });

  test("validates email format", async () => {
    await forgotPage.submitEmail("not-an-email");
    await forgotPage.expectFieldError("email", "valid email");
  });

  test("navigates back to login via link", async ({ page }) => {
    await forgotPage.clickBackToLogin();
    await page.waitForURL("/login");
  });

  test("shows loading state during submission", async () => {
    await forgotPage.submitEmail("creditor@family.com");
    await forgotPage.expectLoading();
  });
});

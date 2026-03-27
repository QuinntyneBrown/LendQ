import { test, expect } from "@playwright/test";
import { ResetPasswordPage } from "../../pages/ResetPasswordPage";

test.describe("L2-1.3: Reset Password (token-based)", () => {
  let resetPage: ResetPasswordPage;

  test.beforeEach(async ({ page }) => {
    resetPage = new ResetPasswordPage(page);
  });

  test("displays reset form when valid token in URL", async () => {
    await resetPage.goto("valid-test-token");
    await resetPage.expectVisible();
  });

  test("resets password and shows success", async () => {
    await resetPage.goto("valid-test-token");
    await resetPage.submitNewPassword("NewPassword123!", "NewPassword123!");
    await resetPage.expectSuccess();
  });

  test("shows error for expired/invalid token", async () => {
    await resetPage.goto("expired-token");
    await resetPage.expectTokenExpiredError();
  });

  test("validates password and confirm-password match", async () => {
    await resetPage.goto("valid-test-token");
    await resetPage.submitNewPassword("Password123!", "Different456!");
    await resetPage.expectFieldError("confirm_password", "match");
  });

  test("validates minimum password length", async () => {
    await resetPage.goto("valid-test-token");
    await resetPage.submitNewPassword("short", "short");
    await resetPage.expectFieldError("password", "8 characters");
  });
});

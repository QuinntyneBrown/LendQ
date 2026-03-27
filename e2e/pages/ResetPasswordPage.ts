import { type Locator, type Page, expect } from "@playwright/test";

export class ResetPasswordPage {
  readonly page: Page;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly resetButton: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.passwordInput = page.getByLabel("New Password", { exact: true });
    this.confirmPasswordInput = page.getByLabel("Confirm Password");
    this.resetButton = page.getByRole("button", { name: "Reset Password" });
    this.successMessage = page.getByTestId("reset-complete-success");
    this.errorMessage = page.getByTestId("token-error");
  }

  async goto(token: string) {
    await this.page.goto(`/reset-password/${token}`);
  }

  async submitNewPassword(password: string, confirm: string) {
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirm);
    await this.resetButton.click();
  }

  getFieldError(field: string) {
    return this.page.getByTestId(`error-${field}`);
  }

  async expectVisible() {
    await expect(this.resetButton).toBeVisible();
  }

  async expectSuccess() {
    await expect(this.successMessage).toBeVisible();
  }

  async expectTokenExpiredError() {
    await expect(this.errorMessage).toBeVisible();
  }

  async expectFieldError(field: string, message: string) {
    await expect(this.getFieldError(field)).toContainText(message);
  }
}

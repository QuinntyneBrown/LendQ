import { type Locator, type Page, expect } from "@playwright/test";

export class ForgotPasswordPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly resetButton: Locator;
  readonly backToLoginLink: Locator;
  readonly successMessage: Locator;
  readonly brandLogo: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel("Email Address");
    this.resetButton = page.getByRole("button", { name: "Send Reset Link" });
    this.backToLoginLink = page.getByRole("link", { name: /Back to Login/i });
    this.successMessage = page.getByTestId("reset-success");
    this.brandLogo = page.getByText("LendQ").first();
  }

  async goto() {
    await this.page.goto("/forgot-password");
  }

  async submitEmail(email: string) {
    await this.emailInput.fill(email);
    await this.resetButton.click();
  }

  async clickBackToLogin() {
    await this.backToLoginLink.click();
  }

  getFieldError(field: string) {
    return this.page.getByTestId(`error-${field}`);
  }

  async expectVisible() {
    await expect(this.resetButton).toBeVisible();
    await expect(this.emailInput).toBeVisible();
  }

  async expectSuccessMessage() {
    await expect(this.successMessage).toBeVisible();
  }

  async expectFieldError(field: string, message: string) {
    await expect(this.getFieldError(field)).toContainText(message);
  }

  async expectLoading() {
    await expect(this.resetButton).toBeDisabled();
  }
}

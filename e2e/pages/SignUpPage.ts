import { type Locator, type Page, expect } from "@playwright/test";

export class SignUpPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly createAccountButton: Locator;
  readonly signInLink: Locator;
  readonly brandLogo: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.getByLabel("Full Name");
    this.emailInput = page.getByLabel("Email Address");
    this.passwordInput = page.getByLabel("Password", { exact: true });
    this.confirmPasswordInput = page.getByLabel("Confirm Password");
    this.createAccountButton = page.getByRole("button", { name: "Create Account" });
    this.signInLink = page.getByRole("link", { name: "Sign In" });
    this.brandLogo = page.getByText("LendQ").first();
    this.successMessage = page.getByTestId("signup-success");
  }

  async goto() {
    await this.page.goto("/signup");
  }

  async signUp(name: string, email: string, password: string, confirmPassword: string) {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword);
    await this.createAccountButton.click();
  }

  async clickSignIn() {
    await this.signInLink.click();
  }

  getFieldError(field: string) {
    return this.page.getByTestId(`error-${field}`);
  }

  async expectVisible() {
    await expect(this.createAccountButton).toBeVisible();
    await expect(this.nameInput).toBeVisible();
  }

  async expectFieldError(field: string, message: string) {
    await expect(this.getFieldError(field)).toContainText(message);
  }

  async expectSuccessState() {
    await expect(this.successMessage).toBeVisible();
  }

  async expectLoading() {
    await expect(this.createAccountButton).toBeDisabled();
  }
}

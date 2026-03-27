import { type Locator, type Page, expect } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly signUpLink: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly brandLogo: Locator;
  readonly brandTagline: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel("Email Address");
    this.passwordInput = page.getByLabel("Password");
    this.signInButton = page.getByRole("button", { name: "Sign In" });
    this.forgotPasswordLink = page.getByRole("link", { name: /Forgot Password/i });
    this.signUpLink = page.getByRole("link", { name: "Sign Up" });
    this.rememberMeCheckbox = page.getByLabel("Remember me");
    this.brandLogo = page.getByText("LendQ").first();
    this.brandTagline = page.getByText("Family lending made simple");
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  async clickSignUp() {
    await this.signUpLink.click();
  }

  getValidationError(field: string) {
    return this.page.getByTestId(`error-${field}`);
  }

  async expectVisible() {
    await expect(this.signInButton).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
  }

  async expectBrandVisible() {
    await expect(this.brandLogo).toBeVisible();
    await expect(this.brandTagline).toBeVisible();
  }

  async expectErrorMessage(message: string) {
    await expect(this.page.locator("[data-testid='toast-error']").first()).toContainText(message);
  }

  async expectLoading() {
    await expect(this.signInButton).toBeDisabled();
  }
}

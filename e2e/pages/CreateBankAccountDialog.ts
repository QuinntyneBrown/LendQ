import { type Locator, type Page, expect } from "@playwright/test";

export class CreateBankAccountDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly dialogTitle: Locator;
  readonly userName: Locator;
  readonly userEmail: Locator;
  readonly currencySelect: Locator;
  readonly initialDepositInput: Locator;
  readonly noteInput: Locator;
  readonly createButton: Locator;
  readonly cancelButton: Locator;
  readonly closeButton: Locator;
  readonly helperText: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole("dialog");
    this.dialogTitle = this.dialog.getByRole("heading", { name: /Create Bank Account/i });
    this.userName = this.dialog.getByTestId("user-name");
    this.userEmail = this.dialog.getByTestId("user-email");
    this.currencySelect = this.dialog.getByLabel(/Currency/i);
    this.initialDepositInput = this.dialog.getByLabel(/Initial Deposit/i);
    this.noteInput = this.dialog.getByLabel(/Note/i);
    this.createButton = this.dialog.getByRole("button", { name: /Create Account/i });
    this.cancelButton = this.dialog.getByRole("button", { name: /Cancel/i });
    this.closeButton = this.dialog.getByRole("button", { name: /close/i });
    this.helperText = this.dialog.getByText(/Leave at \$0\.00/i);
  }

  async expectOpen() {
    await expect(this.dialog).toBeVisible();
    await expect(this.dialogTitle).toBeVisible();
  }

  async expectClosed() {
    await expect(this.dialog).toBeHidden({ timeout: 10000 });
  }

  async expectUserInfo(name: string, email: string) {
    await expect(this.userName).toContainText(name);
    await expect(this.userEmail).toContainText(email);
  }

  async expectDefaultCurrency(currency: string) {
    await expect(this.currencySelect).toContainText(currency);
  }

  async fillInitialDeposit(amount: string) {
    await this.initialDepositInput.clear();
    await this.initialDepositInput.fill(amount);
  }

  async fillNote(note: string) {
    await this.noteInput.clear();
    await this.noteInput.fill(note);
  }

  async clickCreate() {
    await this.createButton.click();
  }

  async clickCancel() {
    await this.cancelButton.click();
  }

  async clickClose() {
    await this.closeButton.click();
  }

  async expectCreating() {
    await expect(this.createButton).toBeDisabled();
  }

  async expectValidationError(message: string) {
    await expect(this.dialog.getByText(message)).toBeVisible();
  }

  async expectHelperTextVisible() {
    await expect(this.helperText).toBeVisible();
  }
}

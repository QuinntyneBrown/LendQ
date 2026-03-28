import { type Locator, type Page, expect } from "@playwright/test";

export class AddEditUserDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly titleText: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly roleSelect: Locator;
  readonly activeToggle: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole("dialog");
    this.titleText = this.dialog.getByRole("heading");
    this.nameInput = this.dialog.getByLabel("Full Name");
    this.emailInput = this.dialog.getByLabel("Email Address");
    this.roleSelect = this.dialog.getByLabel("Role");
    this.activeToggle = this.dialog.getByLabel(/Active/i);
    this.saveButton = this.dialog.getByRole("button", { name: /Save/i });
    this.cancelButton = this.dialog.getByRole("button", { name: "Cancel" });
    this.closeButton = this.dialog.locator("[data-testid='modal-close']");
  }

  async fillName(name: string) {
    await this.nameInput.clear();
    await this.nameInput.fill(name);
  }

  async fillEmail(email: string) {
    await this.emailInput.clear();
    await this.emailInput.fill(email);
  }

  async selectRoles(roles: string[]) {
    for (const role of roles) {
      await this.dialog.getByLabel(role).check();
    }
  }

  async toggleActive() {
    await this.activeToggle.click();
  }

  async clickSave() {
    await this.saveButton.click();
  }

  async clickCancel() {
    await this.cancelButton.click();
  }

  async close() {
    await this.closeButton.click();
  }

  async expectOpen() {
    await expect(this.dialog).toBeVisible();
  }

  async expectClosed() {
    await expect(this.dialog).toBeHidden({ timeout: 10000 });
  }

  async expectTitle(title: string) {
    await expect(this.titleText).toContainText(title);
  }

  async expectFieldError(field: string, message: string) {
    await expect(this.dialog.getByTestId(`error-${field}`)).toContainText(message);
  }

  async expectSaving() {
    await expect(this.saveButton).toBeDisabled();
  }

  async expectPrefilledWith(name: string, email: string) {
    await expect(this.nameInput).toHaveValue(name);
    await expect(this.emailInput).toHaveValue(email);
  }
}

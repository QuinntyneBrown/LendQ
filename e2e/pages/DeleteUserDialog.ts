import { type Locator, type Page, expect } from "@playwright/test";

export class DeleteUserDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly warningIcon: Locator;
  readonly titleText: Locator;
  readonly confirmationMessage: Locator;
  readonly deleteButton: Locator;
  readonly cancelButton: Locator;
  readonly purgeButton: Locator;
  readonly deactivateButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole("dialog");
    this.warningIcon = this.dialog.getByTestId("warning-icon");
    this.titleText = this.dialog.getByRole("heading", { name: /Delete/i });
    this.confirmationMessage = this.dialog.getByTestId("confirmation-message");
    this.deleteButton = this.dialog.getByRole("button", { name: /Delete/i });
    this.cancelButton = this.dialog.getByRole("button", { name: "Cancel" });
    this.purgeButton = this.dialog.getByTestId("purge-button");
    this.deactivateButton = this.dialog.getByTestId("deactivate-button");
  }

  async clickDelete() {
    await this.deleteButton.click();
  }

  async clickCancel() {
    await this.cancelButton.click();
  }

  async expectOpen() {
    await expect(this.dialog).toBeVisible();
  }

  async expectClosed() {
    await expect(this.dialog).toBeHidden({ timeout: 10000 });
  }

  async expectUserName(name: string) {
    await expect(this.confirmationMessage).toContainText(name);
  }

  async expectDeleting() {
    await expect(this.deleteButton).toBeDisabled();
  }

  async clickPurge() {
    await this.purgeButton.click();
  }

  async clickDeactivate() {
    await this.deactivateButton.click();
  }

  async expectPurgeVisible() {
    await expect(this.purgeButton).toBeVisible();
  }

  async expectPurgeNotVisible() {
    await expect(this.purgeButton).toBeHidden();
  }
}

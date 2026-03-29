import { type Locator, type Page, expect } from "@playwright/test";

export class AccountStatusDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly dialogTitle: Locator;
  readonly warningIcon: Locator;
  readonly subtitle: Locator;
  readonly userName: Locator;
  readonly userBalance: Locator;
  readonly impactWarningBox: Locator;
  readonly impactItems: Locator;
  readonly reasonInput: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole("dialog");
    this.dialogTitle = this.dialog.getByRole("heading").first();
    this.warningIcon = this.dialog.getByTestId("warning-icon");
    this.subtitle = this.dialog.getByTestId("status-subtitle");
    this.userName = this.dialog.getByTestId("status-user-name");
    this.userBalance = this.dialog.getByTestId("status-user-balance");
    this.impactWarningBox = this.dialog.getByTestId("impact-warning");
    this.impactItems = this.dialog.getByTestId("impact-item");
    this.reasonInput = this.dialog.getByLabel(/Reason/i);
    this.confirmButton = this.dialog.getByTestId("status-confirm-button");
    this.cancelButton = this.dialog.getByRole("button", { name: /Cancel/i });
  }

  async expectOpen() {
    await expect(this.dialog).toBeVisible();
  }

  async expectClosed() {
    await expect(this.dialog).toBeHidden({ timeout: 10000 });
  }

  async expectTitle(title: string) {
    await expect(this.dialogTitle).toContainText(title);
  }

  async expectUserInfo(name: string) {
    await expect(this.userName).toContainText(name);
  }

  async expectBalance(balance: string) {
    await expect(this.userBalance).toContainText(balance);
  }

  async expectWarningIconVisible() {
    await expect(this.warningIcon).toBeVisible();
  }

  async expectImpactWarningVisible() {
    await expect(this.impactWarningBox).toBeVisible();
  }

  async expectImpactItemCount(count: number) {
    await expect(this.impactItems).toHaveCount(count);
  }

  async expectImpactItemText(index: number, text: string) {
    await expect(this.impactItems.nth(index)).toContainText(text);
  }

  async fillReason(reason: string) {
    await this.reasonInput.clear();
    await this.reasonInput.fill(reason);
  }

  async clickConfirm() {
    await this.confirmButton.click();
  }

  async clickCancel() {
    await this.cancelButton.click();
  }

  async expectConfirmButtonText(text: string | RegExp) {
    await expect(this.confirmButton).toContainText(text);
  }

  async expectConfirmButtonDisabledWithoutReason() {
    await expect(this.confirmButton).toBeDisabled();
  }

  async expectConfirming() {
    await expect(this.confirmButton).toBeDisabled();
  }

  async expectReasonRequired() {
    await expect(this.reasonInput).toHaveAttribute("required", "");
  }
}

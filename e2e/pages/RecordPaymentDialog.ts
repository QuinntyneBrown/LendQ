import { type Locator, type Page, expect } from "@playwright/test";

export class RecordPaymentDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly titleText: Locator;
  readonly scheduledInfo: Locator;
  readonly amountInput: Locator;
  readonly dateInput: Locator;
  readonly methodSelect: Locator;
  readonly notesInput: Locator;
  readonly balancePreview: Locator;
  readonly recordButton: Locator;
  readonly cancelButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole("dialog", { name: /Record Payment/i });
    this.titleText = this.dialog.getByRole("heading", { name: /Record Payment/i });
    this.scheduledInfo = this.dialog.getByTestId("scheduled-info");
    this.amountInput = this.dialog.getByLabel(/Payment Amount/i);
    this.dateInput = this.dialog.getByLabel(/Payment Date/i);
    this.methodSelect = this.dialog.getByLabel(/Payment Method/i);
    this.notesInput = this.dialog.getByLabel(/Notes/i);
    this.balancePreview = this.dialog.getByTestId("balance-preview");
    this.recordButton = this.dialog.getByRole("button", { name: /Record Payment/i });
    this.cancelButton = this.dialog.getByRole("button", { name: "Cancel" });
    this.closeButton = this.dialog.locator("[data-testid='modal-close']");
  }

  async fillAmount(amount: string) {
    await this.amountInput.clear();
    await this.amountInput.fill(amount);
  }

  async fillDate(date: string) {
    await this.dateInput.fill(date);
  }

  async selectMethod(method: string) {
    await this.methodSelect.selectOption(method);
  }

  async fillNotes(text: string) {
    await this.notesInput.fill(text);
  }

  async clickRecord() {
    await this.recordButton.click();
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
    await expect(this.dialog).toBeHidden();
  }

  async expectPrefilledAmount(amount: string) {
    await expect(this.amountInput).toHaveValue(amount);
  }

  async expectBalancePreview(value: string) {
    await expect(this.balancePreview).toContainText(value);
  }

  async expectRecording() {
    await expect(this.recordButton).toBeDisabled();
  }

  async expectFieldError(field: string, message: string) {
    await expect(this.dialog.getByTestId(`error-${field}`)).toContainText(message);
  }
}

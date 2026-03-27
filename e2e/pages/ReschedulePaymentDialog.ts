import { type Locator, type Page, expect } from "@playwright/test";

export class ReschedulePaymentDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly titleText: Locator;
  readonly currentPaymentInfo: Locator;
  readonly newDateInput: Locator;
  readonly reasonTextarea: Locator;
  readonly rescheduleButton: Locator;
  readonly cancelButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole("dialog", { name: /Reschedule Payment/i });
    this.titleText = this.dialog.getByRole("heading", { name: /Reschedule/i });
    this.currentPaymentInfo = this.dialog.getByTestId("current-payment-info");
    this.newDateInput = this.dialog.getByLabel(/New Payment Date/i);
    this.reasonTextarea = this.dialog.getByLabel(/Reason/i);
    this.rescheduleButton = this.dialog.getByRole("button", { name: /Reschedule/i }).last();
    this.cancelButton = this.dialog.getByRole("button", { name: "Cancel" });
    this.closeButton = this.dialog.locator("[data-testid='modal-close']");
  }

  async fillNewDate(date: string) {
    await this.newDateInput.fill(date);
  }

  async fillReason(text: string) {
    await this.reasonTextarea.fill(text);
  }

  async clickReschedule() {
    await this.rescheduleButton.click();
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

  async expectCurrentDate(date: string) {
    await expect(this.currentPaymentInfo).toContainText(date);
  }

  async expectCurrentAmount(amount: string) {
    await expect(this.currentPaymentInfo).toContainText(amount);
  }

  async expectRescheduling() {
    await expect(this.rescheduleButton).toBeDisabled();
  }

  async expectFieldError(field: string, message: string) {
    await expect(this.dialog.getByTestId(`error-${field}`)).toContainText(message);
  }
}

import { type Locator, type Page, expect } from "@playwright/test";

export class PausePaymentDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly titleText: Locator;
  readonly warningInfo: Locator;
  readonly paymentInfo: Locator;
  readonly reasonTextarea: Locator;
  readonly pauseButton: Locator;
  readonly cancelButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole("dialog", { name: /Pause Payment/i });
    this.titleText = this.dialog.getByRole("heading", { name: /Pause/i });
    this.warningInfo = this.dialog.getByTestId("pause-warning");
    this.paymentInfo = this.dialog.getByTestId("payment-info");
    this.reasonTextarea = this.dialog.getByLabel(/Reason/i);
    this.pauseButton = this.dialog.getByRole("button", { name: /Pause Payment/i });
    this.cancelButton = this.dialog.getByRole("button", { name: "Cancel" });
    this.closeButton = this.dialog.locator("[data-testid='modal-close']");
  }

  async fillReason(text: string) {
    await this.reasonTextarea.fill(text);
  }

  async clickPause() {
    await this.pauseButton.click();
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

  async expectWarningVisible() {
    await expect(this.warningInfo).toBeVisible();
  }

  async expectPaymentDate(date: string) {
    await expect(this.paymentInfo).toContainText(date);
  }

  async expectPausing() {
    await expect(this.pauseButton).toBeDisabled();
  }
}

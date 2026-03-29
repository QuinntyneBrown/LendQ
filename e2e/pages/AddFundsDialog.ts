import { type Locator, type Page, expect } from "@playwright/test";

export class AddFundsDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly amountInput: Locator;
  readonly balanceDisplay: Locator;
  readonly progressPreview: Locator;
  readonly addButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole("dialog");
    this.amountInput = this.dialog.getByLabel(/Amount/i);
    this.balanceDisplay = this.dialog.getByTestId("available-balance");
    this.progressPreview = this.dialog.getByTestId("progress-preview");
    this.addButton = this.dialog.getByRole("button", { name: /Add Funds/i });
    this.cancelButton = this.dialog.getByRole("button", { name: /Cancel/i });
  }

  async fillAmount(amount: string) {
    await this.amountInput.clear();
    await this.amountInput.fill(amount);
  }

  async clickAdd() {
    await this.addButton.click();
  }

  async expectOpen() {
    await expect(this.dialog).toBeVisible();
  }

  async expectClosed() {
    await expect(this.dialog).toBeHidden({ timeout: 10000 });
  }
}

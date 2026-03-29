import { type Locator, type Page, expect } from "@playwright/test";

export class DepositWithdrawDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly amountInput: Locator;
  readonly reasonInput: Locator;
  readonly descriptionInput: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;
  readonly balancePreview: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole("dialog");
    this.amountInput = this.dialog.getByLabel(/Amount/i);
    this.reasonInput = this.dialog.getByLabel(/Reason/i);
    this.descriptionInput = this.dialog.getByLabel(/Description|Note/i);
    this.confirmButton = this.dialog.getByRole("button", { name: /Confirm|Deposit|Withdraw/i });
    this.cancelButton = this.dialog.getByRole("button", { name: /Cancel/i });
    this.balancePreview = this.dialog.getByTestId("balance-preview");
  }

  async fillAmount(amount: string) {
    await this.amountInput.clear();
    await this.amountInput.fill(amount);
  }

  async fillReason(reason: string) {
    await this.reasonInput.clear();
    await this.reasonInput.fill(reason);
  }

  async fillDescription(desc: string) {
    await this.descriptionInput.clear();
    await this.descriptionInput.fill(desc);
  }

  async clickConfirm() {
    await this.confirmButton.click();
  }

  async expectOpen() {
    await expect(this.dialog).toBeVisible();
  }

  async expectClosed() {
    await expect(this.dialog).toBeHidden({ timeout: 10000 });
  }
}

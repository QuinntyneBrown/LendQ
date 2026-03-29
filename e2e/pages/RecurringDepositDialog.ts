import { type Locator, type Page, expect } from "@playwright/test";

export class RecurringDepositDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly amountInput: Locator;
  readonly sourceDescriptionInput: Locator;
  readonly frequencySelect: Locator;
  readonly startDateInput: Locator;
  readonly endDateInput: Locator;
  readonly createButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole("dialog");
    this.amountInput = this.dialog.getByLabel(/Amount/i);
    this.sourceDescriptionInput = this.dialog.getByLabel(/Source|Description/i);
    this.frequencySelect = this.dialog.getByLabel(/Frequency/i);
    this.startDateInput = this.dialog.getByLabel(/Start Date/i);
    this.endDateInput = this.dialog.getByLabel(/End Date/i);
    this.createButton = this.dialog.getByRole("button", { name: /Create Schedule|Save/i });
    this.cancelButton = this.dialog.getByRole("button", { name: /Cancel/i });
  }

  async fillAmount(amount: string) {
    await this.amountInput.clear();
    await this.amountInput.fill(amount);
  }

  async fillSourceDescription(desc: string) {
    await this.sourceDescriptionInput.clear();
    await this.sourceDescriptionInput.fill(desc);
  }

  async selectFrequency(freq: string) {
    await this.frequencySelect.selectOption(freq);
  }

  async fillStartDate(date: string) {
    await this.startDateInput.fill(date);
  }

  async clickCreate() {
    await this.createButton.click();
  }

  async expectOpen() {
    await expect(this.dialog).toBeVisible();
  }

  async expectClosed() {
    await expect(this.dialog).toBeHidden({ timeout: 10000 });
  }
}

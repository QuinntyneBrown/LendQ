import { type Locator, type Page, expect } from "@playwright/test";

export class CreateRecurringLoanDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly borrowerSelect: Locator;
  readonly descriptionInput: Locator;
  readonly principalInput: Locator;
  readonly frequencySelect: Locator;
  readonly installmentCountInput: Locator;
  readonly interestRateInput: Locator;
  readonly recurrenceIntervalSelect: Locator;
  readonly startDateInput: Locator;
  readonly endDateInput: Locator;
  readonly maxOccurrencesInput: Locator;
  readonly createButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole("dialog");
    this.borrowerSelect = this.dialog.getByLabel(/Borrower/i);
    this.descriptionInput = this.dialog.getByLabel(/Description/i);
    this.principalInput = this.dialog.getByLabel(/Principal|Amount/i);
    this.frequencySelect = this.dialog.getByLabel(/Repayment Frequency/i);
    this.installmentCountInput = this.dialog.getByLabel(/Installment|Payments/i);
    this.interestRateInput = this.dialog.getByLabel(/Interest/i);
    this.recurrenceIntervalSelect = this.dialog.getByLabel(/Recurrence/i);
    this.startDateInput = this.dialog.getByLabel(/Start Date/i);
    this.endDateInput = this.dialog.getByLabel(/End Date/i);
    this.maxOccurrencesInput = this.dialog.getByLabel(/Max Occurrences/i);
    this.createButton = this.dialog.getByRole("button", { name: /Create/i });
    this.cancelButton = this.dialog.getByRole("button", { name: /Cancel/i });
  }

  async fillDescription(desc: string) {
    await this.descriptionInput.clear();
    await this.descriptionInput.fill(desc);
  }

  async fillPrincipal(amount: string) {
    await this.principalInput.clear();
    await this.principalInput.fill(amount);
  }

  async selectFrequency(freq: string) {
    await this.frequencySelect.selectOption(freq);
  }

  async fillInstallmentCount(count: string) {
    await this.installmentCountInput.clear();
    await this.installmentCountInput.fill(count);
  }

  async selectRecurrenceInterval(interval: string) {
    await this.recurrenceIntervalSelect.selectOption(interval);
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

import { type Locator, type Page, expect } from "@playwright/test";

export class CreateEditLoanModal {
  readonly page: Page;
  readonly dialog: Locator;
  readonly titleText: Locator;
  readonly borrowerSelect: Locator;
  readonly borrowerSearchInput: Locator;
  readonly borrowerOptions: Locator;
  readonly descriptionInput: Locator;
  readonly principalInput: Locator;
  readonly interestRateInput: Locator;
  readonly frequencySelect: Locator;
  readonly startDateInput: Locator;
  readonly notesTextarea: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole("dialog");
    this.titleText = this.dialog.getByRole("heading");
    this.borrowerSelect = this.dialog.getByLabel("Borrower");
    this.borrowerSearchInput = this.dialog.getByPlaceholder(/Select a family member/i);
    this.borrowerOptions = this.dialog.locator("[data-testid='borrower-option']");
    this.descriptionInput = this.dialog.getByLabel("Description");
    this.principalInput = this.dialog.getByLabel(/Principal/i);
    this.interestRateInput = this.dialog.getByLabel(/Interest Rate/i);
    this.frequencySelect = this.dialog.getByLabel(/Repayment Frequency/i);
    this.startDateInput = this.dialog.getByLabel(/Start Date/i);
    this.notesTextarea = this.dialog.getByLabel(/Notes/i);
    this.saveButton = this.dialog.getByRole("button", { name: /Create Loan|Save/i });
    this.cancelButton = this.dialog.getByRole("button", { name: "Cancel" });
    this.closeButton = this.dialog.locator("[data-testid='modal-close']");
  }

  async selectBorrower(name: string) {
    await this.borrowerSearchInput.fill(name);
    await this.page.waitForTimeout(400);
    await this.borrowerOptions.filter({ hasText: name }).first().click();
  }

  async fillDescription(text: string) {
    await this.descriptionInput.fill(text);
  }

  async fillPrincipal(amount: string) {
    await this.principalInput.clear();
    await this.principalInput.fill(amount);
  }

  async fillInterestRate(rate: string) {
    await this.interestRateInput.clear();
    await this.interestRateInput.fill(rate);
  }

  async selectFrequency(freq: string) {
    await this.frequencySelect.selectOption(freq);
  }

  async fillStartDate(date: string) {
    await this.startDateInput.fill(date);
  }

  async fillNotes(text: string) {
    await this.notesTextarea.fill(text);
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

  async expectPrincipalReadOnly() {
    await expect(this.principalInput).toBeDisabled();
  }
}

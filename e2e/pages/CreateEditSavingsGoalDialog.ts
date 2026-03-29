import { type Locator, type Page, expect } from "@playwright/test";

export class CreateEditSavingsGoalDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly nameInput: Locator;
  readonly targetAmountInput: Locator;
  readonly deadlineInput: Locator;
  readonly descriptionInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole("dialog");
    this.nameInput = this.dialog.getByLabel(/Goal Name|Name/i);
    this.targetAmountInput = this.dialog.getByLabel(/Target Amount/i);
    this.deadlineInput = this.dialog.getByLabel(/Deadline/i);
    this.descriptionInput = this.dialog.getByLabel(/Description|Notes/i);
    this.saveButton = this.dialog.getByRole("button", { name: /Save|Create/i });
    this.cancelButton = this.dialog.getByRole("button", { name: /Cancel/i });
  }

  async fillName(name: string) {
    await this.nameInput.clear();
    await this.nameInput.fill(name);
  }

  async fillTargetAmount(amount: string) {
    await this.targetAmountInput.clear();
    await this.targetAmountInput.fill(amount);
  }

  async fillDeadline(date: string) {
    await this.deadlineInput.fill(date);
  }

  async fillDescription(desc: string) {
    await this.descriptionInput.clear();
    await this.descriptionInput.fill(desc);
  }

  async clickSave() {
    await this.saveButton.click();
  }

  async expectOpen() {
    await expect(this.dialog).toBeVisible();
  }

  async expectClosed() {
    await expect(this.dialog).toBeHidden({ timeout: 10000 });
  }
}

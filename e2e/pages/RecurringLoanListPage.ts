import { type Locator, type Page, expect } from "@playwright/test";

export class RecurringLoanListPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly createButton: Locator;
  readonly recurringLoanRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByRole("heading", { name: /Recurring/i });
    this.createButton = page.getByRole("button", { name: /Set Up|Create/i });
    this.recurringLoanRows = page.getByTestId("recurring-loan-row");
  }

  async goto() {
    await this.page.goto("/loans/recurring");
  }

  async expectVisible() {
    await expect(this.pageTitle).toBeVisible();
  }

  async clickCreate() {
    await this.createButton.click();
  }

  async expectRowCount(count: number) {
    await expect(this.recurringLoanRows).toHaveCount(count);
  }

  async clickRow(index: number) {
    await this.recurringLoanRows.nth(index).click();
  }

  statusBadge(index: number) {
    return this.recurringLoanRows.nth(index).getByTestId("status-badge");
  }
}

import { type Locator, type Page, expect } from "@playwright/test";

export class BankAccountPage {
  readonly page: Page;
  readonly balanceDisplay: Locator;
  readonly depositButton: Locator;
  readonly withdrawButton: Locator;
  readonly setupRecurringButton: Locator;
  readonly transactionRows: Locator;
  readonly recurringDepositRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.balanceDisplay = page.getByTestId("account-balance");
    this.depositButton = page.getByRole("button", { name: /Deposit/i });
    this.withdrawButton = page.getByRole("button", { name: /Withdraw/i });
    this.setupRecurringButton = page.getByRole("button", { name: /Set Up Recurring/i });
    this.transactionRows = page.getByTestId("transaction-row");
    this.recurringDepositRows = page.getByTestId("recurring-deposit-row");
  }

  async goto() {
    await this.page.goto("/account");
  }

  async gotoByAccountId(accountId: string) {
    await this.page.goto(`/accounts/${accountId}`);
  }

  async expectVisible() {
    await expect(this.balanceDisplay).toBeVisible();
  }

  async expectBalance(amount: string) {
    await expect(this.balanceDisplay).toContainText(amount);
  }

  async clickDeposit() {
    await this.depositButton.click();
  }

  async clickWithdraw() {
    await this.withdrawButton.click();
  }

  async clickSetupRecurring() {
    await this.setupRecurringButton.click();
  }

  async expectTransactionCount(count: number) {
    await expect(this.transactionRows).toHaveCount(count);
  }

  async expectTransactionAmount(index: number, amount: string) {
    await expect(this.transactionRows.nth(index)).toContainText(amount);
  }
}

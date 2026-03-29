import { type Locator, type Page, expect } from "@playwright/test";

export class AdminAccountDetailPage {
  readonly page: Page;
  readonly backLink: Locator;
  readonly userName: Locator;
  readonly userEmail: Locator;
  readonly accountStatusBadge: Locator;
  readonly manageStatusButton: Locator;

  // Summary metrics
  readonly currentBalance: Locator;
  readonly totalDeposits: Locator;
  readonly totalWithdrawals: Locator;
  readonly accountCreated: Locator;

  // Action buttons
  readonly depositButton: Locator;
  readonly withdrawButton: Locator;

  // Transaction history
  readonly transactionHistorySection: Locator;
  readonly transactionRows: Locator;
  readonly transactionCards: Locator;
  readonly transactionFilterDropdown: Locator;

  // Recurring deposits
  readonly recurringDepositsSection: Locator;
  readonly recurringDepositCards: Locator;
  readonly addRecurringButton: Locator;

  // States
  readonly loadingState: Locator;
  readonly errorState: Locator;
  readonly emptyTransactions: Locator;
  readonly emptyRecurring: Locator;

  constructor(page: Page) {
    this.page = page;
    this.backLink = page.getByRole("link", { name: /Back to Bank Accounts/i });
    this.userName = page.getByTestId("detail-user-name");
    this.userEmail = page.getByTestId("detail-user-email");
    this.accountStatusBadge = page.getByTestId("detail-account-status");
    this.manageStatusButton = page.getByRole("button", { name: /Manage Status/i });

    this.currentBalance = page.getByTestId("metric-current-balance");
    this.totalDeposits = page.getByTestId("metric-total-deposits");
    this.totalWithdrawals = page.getByTestId("metric-total-withdrawals");
    this.accountCreated = page.getByTestId("metric-account-created");

    this.depositButton = page.getByRole("button", { name: /Deposit/i });
    this.withdrawButton = page.getByRole("button", { name: /Withdraw/i });

    this.transactionHistorySection = page.getByTestId("transaction-history-section");
    this.transactionRows = page.getByTestId("transaction-row");
    this.transactionCards = page.getByTestId("transaction-card");
    this.transactionFilterDropdown = page.getByTestId("transaction-type-filter");

    this.recurringDepositsSection = page.getByTestId("recurring-deposits-section");
    this.recurringDepositCards = page.getByTestId("recurring-deposit-card");
    this.addRecurringButton = page.getByRole("button", { name: /Add/i });

    this.loadingState = page.getByTestId("loading-state");
    this.errorState = page.getByTestId("error-state");
    this.emptyTransactions = page.getByTestId("empty-transactions");
    this.emptyRecurring = page.getByTestId("empty-recurring");
  }

  async goto(accountId: string) {
    await this.page.goto(`/admin/accounts/${accountId}`);
  }

  async expectVisible() {
    await expect(this.userName).toBeVisible();
  }

  async clickBack() {
    await this.backLink.click();
  }

  async expectNavigatedToList() {
    await this.page.waitForURL("**/admin/accounts");
  }

  // User info assertions
  async expectUserInfo(name: string, email: string) {
    await expect(this.userName).toContainText(name);
    await expect(this.userEmail).toContainText(email);
  }

  async expectAccountStatus(status: string) {
    await expect(this.accountStatusBadge).toContainText(status);
  }

  // Metric assertions
  async expectBalance(amount: string) {
    await expect(this.currentBalance).toContainText(amount);
  }

  async expectTotalDeposits(amount: string) {
    await expect(this.totalDeposits).toContainText(amount);
  }

  async expectTotalWithdrawals(amount: string) {
    await expect(this.totalWithdrawals).toContainText(amount);
  }

  async expectCreatedDate(date: string) {
    await expect(this.accountCreated).toContainText(date);
  }

  // Actions
  async clickDeposit() {
    await this.depositButton.click();
  }

  async clickWithdraw() {
    await this.withdrawButton.click();
  }

  async clickManageStatus() {
    await this.manageStatusButton.click();
  }

  async clickAddRecurring() {
    await this.addRecurringButton.click();
  }

  // Transaction assertions
  async expectTransactionCount(count: number) {
    await expect(this.transactionRows.or(this.transactionCards)).toHaveCount(count);
  }

  async expectTransactionDescription(index: number, description: string) {
    const row = this.transactionRows.or(this.transactionCards).nth(index);
    await expect(row).toContainText(description);
  }

  async expectTransactionAmount(index: number, amount: string) {
    const row = this.transactionRows.or(this.transactionCards).nth(index);
    await expect(row).toContainText(amount);
  }

  async expectTransactionType(index: number, type: string) {
    const row = this.transactionRows.or(this.transactionCards).nth(index);
    await expect(row).toContainText(type);
  }

  async filterTransactionsByType(type: string) {
    await this.transactionFilterDropdown.click();
    await this.page.getByRole("option", { name: type }).click();
  }

  // Recurring deposit assertions
  async expectRecurringDepositCount(count: number) {
    await expect(this.recurringDepositCards).toHaveCount(count);
  }

  async expectRecurringDepositName(index: number, name: string) {
    await expect(this.recurringDepositCards.nth(index)).toContainText(name);
  }

  async expectRecurringDepositStatus(index: number, status: string) {
    await expect(this.recurringDepositCards.nth(index)).toContainText(status);
  }

  // State assertions
  async expectLoading() {
    await expect(this.loadingState).toBeVisible();
  }

  async expectError() {
    await expect(this.errorState).toBeVisible();
  }

  async expectEmptyTransactions() {
    await expect(this.emptyTransactions).toBeVisible();
  }

  async expectEmptyRecurring() {
    await expect(this.emptyRecurring).toBeVisible();
  }
}

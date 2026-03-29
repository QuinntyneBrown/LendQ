import { type Locator, type Page, expect } from "@playwright/test";

export class AdminBankAccountsPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly subtitle: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly accountsTable: Locator;
  readonly accountRows: Locator;
  readonly accountCards: Locator;
  readonly pagination: Locator;
  readonly emptyState: Locator;
  readonly loadingState: Locator;
  readonly errorState: Locator;

  // Stat cards
  readonly totalAccountsStat: Locator;
  readonly activeAccountsStat: Locator;
  readonly frozenAccountsStat: Locator;
  readonly noAccountStat: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByRole("heading", { name: "Bank Accounts" });
    this.subtitle = page.getByText(/Manage all user bank accounts/i);
    this.searchInput = page.getByPlaceholder(/Search by name or email/i);
    this.statusFilter = page.getByTestId("status-filter");
    this.accountsTable = page.getByRole("table");
    this.accountRows = page.getByTestId("account-row");
    this.accountCards = page.getByTestId("account-card");
    this.pagination = page.getByTestId("pagination");
    this.emptyState = page.getByTestId("empty-state");
    this.loadingState = page.getByTestId("loading-state");
    this.errorState = page.getByTestId("error-state");

    this.totalAccountsStat = page.getByTestId("stat-total-accounts");
    this.activeAccountsStat = page.getByTestId("stat-active-accounts");
    this.frozenAccountsStat = page.getByTestId("stat-frozen-accounts");
    this.noAccountStat = page.getByTestId("stat-no-account");
  }

  async goto() {
    await this.page.goto("/admin/accounts");
  }

  async expectVisible() {
    await expect(this.pageTitle).toBeVisible();
  }

  async expectAccessDenied() {
    await expect(this.page.getByText(/Access Denied|Unauthorized|403/i)).toBeVisible();
  }

  // Search and filter
  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(400);
  }

  async clearSearch() {
    await this.searchInput.clear();
    await this.page.waitForTimeout(400);
  }

  async filterByStatus(status: "All" | "Active" | "Frozen" | "Closed" | "No Account") {
    await this.statusFilter.click();
    await this.page.getByRole("option", { name: status }).click();
  }

  async selectStatusFilterPill(status: string) {
    await this.page.getByRole("button", { name: status, exact: true }).click();
  }

  // Table interactions
  async sortBy(column: string) {
    await this.page.getByRole("columnheader", { name: column }).click();
  }

  async clickViewAccount(index: number) {
    await this.accountRows.nth(index).getByRole("button", { name: /View/i }).click();
  }

  async clickCreateAccountForRow(index: number) {
    await this.accountRows.nth(index).getByRole("button", { name: /Create Account/i }).click();
  }

  async clickCreateAccountForCard(index: number) {
    await this.accountCards.nth(index).getByRole("button", { name: /Create Account/i }).click();
  }

  async goToPage(n: number) {
    await this.pagination.getByRole("button", { name: String(n) }).click();
  }

  // Row assertions
  async expectRowCount(count: number) {
    await expect(this.accountRows).toHaveCount(count);
  }

  async expectCardCount(count: number) {
    await expect(this.accountCards).toHaveCount(count);
  }

  async expectUserInRow(index: number, name: string) {
    await expect(this.accountRows.nth(index)).toContainText(name);
  }

  async expectRowStatus(index: number, status: string) {
    await expect(this.accountRows.nth(index).getByTestId("account-status")).toContainText(status);
  }

  async expectRowBalance(index: number, balance: string) {
    await expect(this.accountRows.nth(index)).toContainText(balance);
  }

  async expectNoAccountRow(index: number) {
    const row = this.accountRows.nth(index);
    await expect(row.getByTestId("account-status")).toContainText("No Account");
    await expect(row.getByRole("button", { name: /Create Account/i })).toBeVisible();
  }

  async expectCreateAccountButtonVisible(index: number) {
    await expect(
      this.accountRows.nth(index).getByRole("button", { name: /Create Account/i }),
    ).toBeVisible();
  }

  async expectViewButtonVisible(index: number) {
    await expect(
      this.accountRows.nth(index).getByRole("button", { name: /View/i }),
    ).toBeVisible();
  }

  // Stat assertions
  async expectStatValue(testId: string, value: string) {
    await expect(this.page.getByTestId(testId)).toContainText(value);
  }

  // State assertions
  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }

  async expectLoading() {
    await expect(this.loadingState).toBeVisible();
  }

  async expectError() {
    await expect(this.errorState).toBeVisible();
  }
}

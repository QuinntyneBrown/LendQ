import { type Locator, type Page, expect } from "@playwright/test";

export class LoanListPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly createLoanButton: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly creditorTab: Locator;
  readonly borrowerTab: Locator;
  readonly loanTable: Locator;
  readonly loanRows: Locator;
  readonly loanCards: Locator;
  readonly pagination: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByRole("heading", { name: /Loans|Borrowings/i });
    this.createLoanButton = page.getByRole("button", { name: /Create New Loan/i });
    this.searchInput = page.getByPlaceholder(/Search loans/i);
    this.statusFilter = page.getByTestId("status-filter");
    this.creditorTab = page.getByRole("tab", { name: /My Loans/i });
    this.borrowerTab = page.getByRole("tab", { name: /Borrowings/i });
    this.loanTable = page.getByRole("table");
    this.loanRows = page.locator("[data-testid='loan-row']");
    this.loanCards = page.locator("[data-testid='loan-card']");
    this.pagination = page.getByTestId("pagination");
    this.emptyState = page.getByTestId("empty-state");
  }

  async goto() {
    await this.page.goto("/loans");
  }

  async gotoCreditorView() {
    await this.page.goto("/loans?view=creditor");
  }

  async gotoBorrowerView() {
    await this.page.goto("/loans?view=borrower");
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(400);
  }

  async filterByStatus(status: string) {
    await this.statusFilter.selectOption(status);
  }

  async clickCreateLoan() {
    await this.createLoanButton.click();
  }

  async clickLoanRow(index: number) {
    await this.loanRows.nth(index).click();
  }

  async goToPage(n: number) {
    await this.pagination.getByRole("button", { name: String(n) }).click();
  }

  statusBadge(index: number) {
    return this.loanRows.nth(index).locator("[data-testid='status-badge']");
  }

  async expectLoanCount(n: number) {
    await expect(this.loanRows).toHaveCount(n);
  }

  async expectLoanInRow(index: number, data: { borrower?: string; description?: string }) {
    const row = this.loanRows.nth(index);
    if (data.borrower) await expect(row).toContainText(data.borrower);
    if (data.description) await expect(row).toContainText(data.description);
  }

  async expectStatusBadge(index: number, status: string) {
    await expect(this.statusBadge(index)).toContainText(status);
  }

  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }

  async expectCreateButtonVisible() {
    await expect(this.createLoanButton).toBeVisible();
  }

  async expectCreateButtonHidden() {
    await expect(this.createLoanButton).toBeHidden();
  }
}

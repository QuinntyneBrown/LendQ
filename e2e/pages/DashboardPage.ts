import { type Locator, type Page, expect } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly welcomeMessage: Locator;
  readonly totalLentOut: Locator;
  readonly totalOwed: Locator;
  readonly upcomingPayments: Locator;
  readonly overduePayments: Locator;
  readonly loansIGaveTab: Locator;
  readonly loansIOweTab: Locator;
  readonly loanRows: Locator;
  readonly activityItems: Locator;
  readonly viewAllLink: Locator;
  readonly loadingSkeletons: Locator;
  readonly errorStates: Locator;
  readonly retryButtons: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByRole("heading", { name: "Dashboard" });
    this.welcomeMessage = page.getByText(/Welcome back/);
    this.totalLentOut = page.getByTestId("metric-total-lent-out");
    this.totalOwed = page.getByTestId("metric-total-owed");
    this.upcomingPayments = page.getByTestId("metric-upcoming-payments");
    this.overduePayments = page.getByTestId("metric-overdue-payments");
    this.loansIGaveTab = page.getByRole("tab", { name: "Loans I Gave" });
    this.loansIOweTab = page.getByRole("tab", { name: "Loans I Owe" });
    this.loanRows = page.locator("[data-testid='active-loan-row']");
    this.activityItems = page.locator("[data-testid='activity-item']");
    this.viewAllLink = page.getByRole("link", { name: "View All" });
    this.loadingSkeletons = page.locator("[data-testid='skeleton']");
    this.errorStates = page.locator("[data-testid='error-state']");
    this.retryButtons = page.getByRole("button", { name: "Retry" });
  }

  async goto() {
    await this.page.goto("/dashboard");
  }

  async switchToLoansIGave() {
    await this.loansIGaveTab.click();
  }

  async switchToLoansIOwe() {
    await this.loansIOweTab.click();
  }

  async clickLoanRow(index: number) {
    await this.loanRows.nth(index).click();
  }

  async clickViewAll() {
    await this.viewAllLink.click();
  }

  async retrySection(name: string) {
    await this.page.locator(`[data-testid="error-${name}"] button`).click();
  }

  async expectSummaryCard(testId: string, value: string) {
    await expect(this.page.getByTestId(testId)).toContainText(value);
  }

  async expectLoanCount(n: number) {
    await expect(this.loanRows).toHaveCount(n);
  }

  async expectActivityCount(n: number) {
    await expect(this.activityItems).toHaveCount(n);
  }

  async expectLoading() {
    await expect(this.loadingSkeletons.first()).toBeVisible();
  }

  async expectLoaded() {
    await expect(this.loadingSkeletons).toHaveCount(0);
  }

  async expectSectionError(name: string) {
    await expect(this.page.getByTestId(`error-${name}`)).toBeVisible();
  }
}

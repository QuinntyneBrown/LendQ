import { type Locator, type Page, expect } from "@playwright/test";

export class RecurringLoanDetailPage {
  readonly page: Page;
  readonly title: Locator;
  readonly statusBadge: Locator;
  readonly editButton: Locator;
  readonly pauseButton: Locator;
  readonly resumeButton: Locator;
  readonly cancelButton: Locator;
  readonly submitButton: Locator;
  readonly metricTotalGenerated: Locator;
  readonly metricActiveLoans: Locator;
  readonly metricTotalDisbursed: Locator;
  readonly metricNextGeneration: Locator;
  readonly generatedLoanRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.getByTestId("recurring-loan-title");
    this.statusBadge = page.getByTestId("recurring-loan-status");
    this.editButton = page.getByRole("button", { name: /Edit/i });
    this.pauseButton = page.getByRole("button", { name: /Pause/i });
    this.resumeButton = page.getByRole("button", { name: /Resume/i });
    this.cancelButton = page.getByRole("button", { name: /Cancel/i });
    this.submitButton = page.getByRole("button", { name: /Submit for Approval/i });
    this.metricTotalGenerated = page.getByTestId("metric-total-generated");
    this.metricActiveLoans = page.getByTestId("metric-active-loans");
    this.metricTotalDisbursed = page.getByTestId("metric-total-disbursed");
    this.metricNextGeneration = page.getByTestId("metric-next-generation");
    this.generatedLoanRows = page.getByTestId("generated-loan-row");
  }

  async goto(recurringId: string) {
    await this.page.goto(`/loans/recurring/${recurringId}`);
  }

  async expectVisible() {
    await expect(this.title).toBeVisible();
  }

  async expectStatus(status: string) {
    await expect(this.statusBadge).toContainText(status);
  }

  async clickPause() {
    await this.pauseButton.click();
  }

  async clickResume() {
    await this.resumeButton.click();
  }

  async clickSubmitForApproval() {
    await this.submitButton.click();
  }
}

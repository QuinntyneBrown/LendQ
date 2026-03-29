import { type Locator, type Page, expect } from "@playwright/test";

export class LoanDetailPage {
  readonly page: Page;
  readonly loanTitle: Locator;
  readonly statusBadge: Locator;
  readonly editLoanButton: Locator;
  readonly recordPaymentButton: Locator;
  readonly recordButton: Locator;
  readonly principalCard: Locator;
  readonly totalPaidCard: Locator;
  readonly outstandingCard: Locator;
  readonly nextPaymentCard: Locator;
  readonly loanInfoCard: Locator;
  readonly paymentScheduleCard: Locator;
  readonly paymentHistorySection: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loanTitle = page.getByTestId("loan-title");
    this.statusBadge = page.getByTestId("loan-status-badge");
    this.editLoanButton = page.getByRole("button", { name: /Edit Loan/i });
    this.recordPaymentButton = page.getByRole("button", { name: /Record Payment/i }).first();
    this.recordButton = page.getByRole("button", { name: /^Record$/i });
    this.principalCard = page.getByTestId("metric-principal");
    this.totalPaidCard = page.getByTestId("metric-total-paid");
    this.outstandingCard = page.getByTestId("metric-outstanding");
    this.nextPaymentCard = page.getByTestId("metric-next-payment");
    this.loanInfoCard = page.getByTestId("loan-info-card");
    this.paymentScheduleCard = page.getByTestId("payment-schedule-card");
    this.paymentHistorySection = page.getByTestId("payment-history");
    this.backButton = page.getByRole("button", { name: /back/i });
  }

  async goto(loanId: string) {
    await this.page.goto(`/loans/${loanId}`);
  }

  async clickEditLoan() {
    await this.editLoanButton.click();
  }

  async clickRecordPayment() {
    await this.recordPaymentButton.click();
  }

  async clickBack() {
    await this.backButton.click();
  }

  async expectTitle(title: string) {
    await expect(this.loanTitle).toContainText(title);
  }

  async expectStatus(status: string) {
    await expect(this.statusBadge).toContainText(status);
  }

  async expectSummaryCard(testId: string, value: string) {
    await expect(this.page.getByTestId(testId)).toContainText(value);
  }

  async expectPaymentCount(n: number) {
    await expect(this.paymentScheduleCard.locator("[data-testid='payment-row']")).toHaveCount(n);
  }

  async expectBorrowerRestrictions() {
    await expect(this.editLoanButton).toBeHidden();
  }
}

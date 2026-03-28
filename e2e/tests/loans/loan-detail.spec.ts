import { test, expect } from "../../fixtures/data.fixture";
import { LoanDetailPage } from "../../pages/LoanDetailPage";

test.describe("L2-3.4: Loan Detail Screen", () => {
  test("displays loan title, status badge, and back button", async ({ creditorPage, loanDetailScenario }) => {
    const detail = new LoanDetailPage(creditorPage);
    await detail.goto(loanDetailScenario.loanId);
    await expect(detail.loanTitle).toBeVisible();
    await expect(detail.statusBadge).toBeVisible();
    await expect(detail.backButton).toBeVisible();
  });

  test("displays 4 summary cards with correct values", async ({ creditorPage, loanDetailScenario }) => {
    const detail = new LoanDetailPage(creditorPage);
    await detail.goto(loanDetailScenario.loanId);
    await expect(detail.principalCard).toBeVisible();
    await expect(detail.totalPaidCard).toBeVisible();
    await expect(detail.outstandingCard).toBeVisible();
    await expect(detail.nextPaymentCard).toBeVisible();
  });

  test("displays loan information card with all fields", async ({ creditorPage, loanDetailScenario }) => {
    const detail = new LoanDetailPage(creditorPage);
    await detail.goto(loanDetailScenario.loanId);
    await expect(detail.loanInfoCard).toBeVisible();
  });

  test("displays payment schedule section", async ({ creditorPage, loanDetailScenario }) => {
    const detail = new LoanDetailPage(creditorPage);
    await detail.goto(loanDetailScenario.loanId);
    await expect(detail.paymentScheduleCard).toBeVisible();
  });

  test("displays payment history section", async ({ creditorPage, loanDetailScenario }) => {
    const detail = new LoanDetailPage(creditorPage);
    await detail.goto(loanDetailScenario.loanId);
    await expect(detail.paymentHistorySection).toBeVisible();
  });

  test("shows Edit Loan button for creditor", async ({ creditorPage, loanDetailScenario }) => {
    const detail = new LoanDetailPage(creditorPage);
    await detail.goto(loanDetailScenario.loanId);
    await expect(detail.editLoanButton).toBeVisible();
  });

  test("shows Record Payment button", async ({ creditorPage, loanDetailScenario }) => {
    const detail = new LoanDetailPage(creditorPage);
    await detail.goto(loanDetailScenario.loanId);
    await expect(detail.recordPaymentButton).toBeVisible();
  });

  test("shows contextual actions based on user role", async ({ borrowerPage, loanDetailScenario }) => {
    const detail = new LoanDetailPage(borrowerPage);
    await detail.goto(loanDetailScenario.loanId);
    await detail.expectBorrowerRestrictions();
  });

  test("navigates back to loan list on back click", async ({ creditorPage, loanDetailScenario }) => {
    const detail = new LoanDetailPage(creditorPage);
    await detail.goto(loanDetailScenario.loanId);
    await detail.clickBack();
    await creditorPage.waitForURL(/\/loans/);
  });
});

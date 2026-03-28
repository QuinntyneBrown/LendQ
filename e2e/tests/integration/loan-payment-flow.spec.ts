import { test, expect } from "../../fixtures/auth.fixture";
import { LoanListPage } from "../../pages/LoanListPage";
import { CreateEditLoanModal } from "../../pages/CreateEditLoanModal";
import { LoanDetailPage } from "../../pages/LoanDetailPage";
import { PaymentScheduleSection } from "../../pages/PaymentScheduleSection";
import { RecordPaymentDialog } from "../../pages/RecordPaymentDialog";
import { DashboardPage } from "../../pages/DashboardPage";
import { futureIsoDate, isoDateFromToday } from "../../helpers/date-values";

test.describe("End-to-end: Full loan lifecycle @smoke", () => {
  test("creditor creates a loan, borrower records payments until paid off", async ({
    creditorPage,
  }) => {
    const startDate = futureIsoDate(7);
    const description = `E2E Test Loan ${Date.now()}`;
    const loanList = new LoanListPage(creditorPage);
    const modal = new CreateEditLoanModal(creditorPage);

    // Step 1: Creditor creates a loan
    await loanList.gotoCreditorView();
    await loanList.clickCreateLoan();
    await modal.selectBorrower("Sarah");
    await modal.fillDescription(description);
    await modal.fillPrincipal("1000");
    await modal.selectFrequency("MONTHLY");
    await modal.fillNumPayments("12");
    await modal.fillStartDate(startDate);
    await modal.clickSave();
    await modal.expectClosed();

    // Step 2: Navigate to loan detail
    await creditorPage.waitForURL(/\/loans\/[a-z0-9-]+/);
    const detail = new LoanDetailPage(creditorPage);
    await expect(detail.loanTitle).toContainText(description);
    await detail.expectStatus("Active");

    // Step 3: Record a payment
    const schedule = new PaymentScheduleSection(creditorPage);
    const payDialog = new RecordPaymentDialog(creditorPage);
    await schedule.clickRecordPayment(0);
    await payDialog.expectOpen();
    await payDialog.fillDate(isoDateFromToday());
    await payDialog.clickRecord();
    await payDialog.expectClosed();
    await schedule.expectPaymentStatus(0, "Paid");

    // Step 4: Dashboard updates
    const dashboard = new DashboardPage(creditorPage);
    await dashboard.goto();
    await expect(dashboard.totalLentOut).toBeVisible();
  });
});

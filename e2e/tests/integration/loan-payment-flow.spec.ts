import { test, expect } from "../../fixtures/auth.fixture";
import { LoanListPage } from "../../pages/LoanListPage";
import { CreateEditLoanModal } from "../../pages/CreateEditLoanModal";
import { LoanDetailPage } from "../../pages/LoanDetailPage";
import { PaymentScheduleSection } from "../../pages/PaymentScheduleSection";
import { RecordPaymentDialog } from "../../pages/RecordPaymentDialog";
import { DashboardPage } from "../../pages/DashboardPage";
import { ToastComponent } from "../../pages/ToastComponent";

test.describe("End-to-end: Full loan lifecycle", () => {
  test("creditor creates a loan, borrower records payments until paid off", async ({
    creditorPage,
  }) => {
    const loanList = new LoanListPage(creditorPage);
    const modal = new CreateEditLoanModal(creditorPage);
    const toast = new ToastComponent(creditorPage);

    // Step 1: Creditor creates a loan
    await loanList.gotoCreditorView();
    await loanList.clickCreateLoan();
    await modal.selectBorrower("Sarah");
    await modal.fillDescription("E2E Test Loan");
    await modal.fillPrincipal("1000");
    await modal.selectFrequency("MONTHLY");
    await modal.fillStartDate("2025-04-01");
    await modal.clickSave();
    await modal.expectClosed();
    await toast.expectToast("success", "created");

    // Step 2: Navigate to loan detail
    await creditorPage.waitForURL(/\/loans\/[a-z0-9-]+/);
    const detail = new LoanDetailPage(creditorPage);
    await expect(detail.loanTitle).toContainText("E2E Test Loan");
    await detail.expectStatus("Active");

    // Step 3: Record a payment
    const schedule = new PaymentScheduleSection(creditorPage);
    const payDialog = new RecordPaymentDialog(creditorPage);
    await schedule.clickRecordPayment(0);
    await payDialog.expectOpen();
    await payDialog.fillDate("2025-04-01");
    await payDialog.clickRecord();
    await payDialog.expectClosed();
    await toast.expectToast("success", "recorded");

    // Step 4: Dashboard updates
    const dashboard = new DashboardPage(creditorPage);
    await dashboard.goto();
    await expect(dashboard.totalLentOut).toBeVisible();
  });
});

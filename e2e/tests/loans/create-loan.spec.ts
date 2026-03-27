import { test, expect } from "../../fixtures/auth.fixture";
import { LoanListPage } from "../../pages/LoanListPage";
import { CreateEditLoanModal } from "../../pages/CreateEditLoanModal";
import { ToastComponent } from "../../pages/ToastComponent";

test.describe("L2-3.3: Create Loan Form", () => {
  let loanList: LoanListPage;
  let modal: CreateEditLoanModal;
  let toast: ToastComponent;

  test.beforeEach(async ({ creditorPage }) => {
    loanList = new LoanListPage(creditorPage);
    modal = new CreateEditLoanModal(creditorPage);
    toast = new ToastComponent(creditorPage);
    await loanList.gotoCreditorView();
  });

  test("opens create-loan modal from loan list", async () => {
    await loanList.clickCreateLoan();
    await modal.expectOpen();
    await modal.expectTitle("Create New Loan");
  });

  test("searches and selects a borrower", async () => {
    await loanList.clickCreateLoan();
    await modal.selectBorrower("Sarah");
    await expect(modal.borrowerSelect).toContainText("Sarah");
  });

  test("fills all loan fields", async () => {
    await loanList.clickCreateLoan();
    await modal.selectBorrower("Sarah");
    await modal.fillDescription("Kitchen renovation");
    await modal.fillPrincipal("5000");
    await modal.fillInterestRate("0");
    await modal.selectFrequency("MONTHLY");
    await modal.fillStartDate("2025-04-01");
    await modal.fillNotes("Test loan notes");
    await modal.clickSave();
    await modal.expectClosed();
    await toast.expectToast("success", "Loan created");
  });

  test("creates loan and shows success toast", async () => {
    await loanList.clickCreateLoan();
    await modal.selectBorrower("Sarah");
    await modal.fillDescription("Test loan");
    await modal.fillPrincipal("1000");
    await modal.selectFrequency("MONTHLY");
    await modal.fillStartDate("2025-04-01");
    await modal.clickSave();
    await toast.expectToast("success", "created");
  });

  test("navigates to new loan detail after creation", async ({ creditorPage }) => {
    await loanList.clickCreateLoan();
    await modal.selectBorrower("Sarah");
    await modal.fillDescription("Nav test loan");
    await modal.fillPrincipal("2000");
    await modal.selectFrequency("MONTHLY");
    await modal.fillStartDate("2025-04-01");
    await modal.clickSave();
    await creditorPage.waitForURL(/\/loans\/[a-z0-9-]+/);
  });

  test("validates required fields", async () => {
    await loanList.clickCreateLoan();
    await modal.clickSave();
    await modal.expectFieldError("borrower_id", "required");
    await modal.expectFieldError("description", "required");
    await modal.expectFieldError("principal", "required");
  });

  test("validates principal is positive", async () => {
    await loanList.clickCreateLoan();
    await modal.fillPrincipal("-100");
    await modal.clickSave();
    await modal.expectFieldError("principal", "positive");
  });

  test("validates start date is not in the past", async () => {
    await loanList.clickCreateLoan();
    await modal.fillStartDate("2020-01-01");
    await modal.clickSave();
    await modal.expectFieldError("start_date", "future");
  });

  test("closes modal on cancel", async () => {
    await loanList.clickCreateLoan();
    await modal.fillDescription("Should not save");
    await modal.clickCancel();
    await modal.expectClosed();
  });

  test("shows loading state during save", async () => {
    await loanList.clickCreateLoan();
    await modal.selectBorrower("Sarah");
    await modal.fillDescription("Loading test");
    await modal.fillPrincipal("1000");
    await modal.selectFrequency("MONTHLY");
    await modal.fillStartDate("2025-04-01");
    await modal.clickSave();
    await modal.expectSaving();
  });
});

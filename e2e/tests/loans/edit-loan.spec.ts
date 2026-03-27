import { test, expect } from "../../fixtures/auth.fixture";
import { LoanDetailPage } from "../../pages/LoanDetailPage";
import { CreateEditLoanModal } from "../../pages/CreateEditLoanModal";
import { ToastComponent } from "../../pages/ToastComponent";

test.describe("L2-3.3, L2-3.5: Edit Loan + Borrower Restrictions", () => {
  test("opens edit modal pre-filled with loan data", async ({ creditorPage }) => {
    const detail = new LoanDetailPage(creditorPage);
    const modal = new CreateEditLoanModal(creditorPage);
    await detail.goto("test-loan-id");
    await detail.clickEditLoan();
    await modal.expectOpen();
    await expect(modal.descriptionInput).not.toHaveValue("");
  });

  test("creditor can edit all fields", async ({ creditorPage }) => {
    const detail = new LoanDetailPage(creditorPage);
    const modal = new CreateEditLoanModal(creditorPage);
    const toast = new ToastComponent(creditorPage);
    await detail.goto("test-loan-id");
    await detail.clickEditLoan();
    await modal.fillDescription("Updated description");
    await modal.fillPrincipal("6000");
    await modal.clickSave();
    await toast.expectToast("success", "updated");
  });

  test("borrower sees principal as read-only", async ({ borrowerPage }) => {
    const detail = new LoanDetailPage(borrowerPage);
    const modal = new CreateEditLoanModal(borrowerPage);
    await detail.goto("test-loan-id");
    await detail.clickEditLoan();
    await modal.expectPrincipalReadOnly();
  });

  test("borrower sees creditor-controlled terms as non-editable", async ({ borrowerPage }) => {
    const detail = new LoanDetailPage(borrowerPage);
    const modal = new CreateEditLoanModal(borrowerPage);
    await detail.goto("test-loan-id");
    await detail.clickEditLoan();
    await modal.expectPrincipalReadOnly();
    await expect(modal.interestRateInput).toBeDisabled();
  });

  test("saves changes and shows success toast", async ({ creditorPage }) => {
    const detail = new LoanDetailPage(creditorPage);
    const modal = new CreateEditLoanModal(creditorPage);
    const toast = new ToastComponent(creditorPage);
    await detail.goto("test-loan-id");
    await detail.clickEditLoan();
    await modal.fillNotes("Updated notes");
    await modal.clickSave();
    await modal.expectClosed();
    await toast.expectToast("success", "updated");
  });

  test("shows validation errors for invalid data", async ({ creditorPage }) => {
    const detail = new LoanDetailPage(creditorPage);
    const modal = new CreateEditLoanModal(creditorPage);
    await detail.goto("test-loan-id");
    await detail.clickEditLoan();
    await modal.fillPrincipal("0");
    await modal.clickSave();
    await modal.expectFieldError("principal", "positive");
  });
});

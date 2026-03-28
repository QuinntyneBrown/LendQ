import { test, expect } from "../../fixtures/data.fixture";
import { LoanDetailPage } from "../../pages/LoanDetailPage";
import { CreateEditLoanModal } from "../../pages/CreateEditLoanModal";

test.describe("L2-3.3, L2-3.5: Edit Loan + Borrower Restrictions", () => {
  test("opens edit modal pre-filled with loan data", async ({ creditorPage, seededLoanId }) => {
    const detail = new LoanDetailPage(creditorPage);
    const modal = new CreateEditLoanModal(creditorPage);
    await detail.goto(seededLoanId);
    await detail.clickEditLoan();
    await modal.expectOpen();
    await expect(modal.descriptionInput).not.toHaveValue("");
  });

  test("creditor can edit all fields", async ({ creditorPage, seededLoanId }) => {
    const detail = new LoanDetailPage(creditorPage);
    const modal = new CreateEditLoanModal(creditorPage);
    await detail.goto(seededLoanId);
    await detail.clickEditLoan();
    await modal.fillDescription("Updated description");
    await modal.fillPrincipal("6000");
    await modal.clickSave();
    await modal.expectClosed();
    await expect(detail.loanTitle).toContainText("Updated description");
  });

  test("borrower sees principal as read-only", async ({ borrowerPage, seededLoanId }) => {
    const detail = new LoanDetailPage(borrowerPage);
    const modal = new CreateEditLoanModal(borrowerPage);
    await detail.goto(seededLoanId);
    await detail.clickEditLoan();
    await modal.expectPrincipalReadOnly();
  });

  test("borrower sees creditor-controlled terms as non-editable", async ({ borrowerPage, seededLoanId }) => {
    const detail = new LoanDetailPage(borrowerPage);
    const modal = new CreateEditLoanModal(borrowerPage);
    await detail.goto(seededLoanId);
    await detail.clickEditLoan();
    await modal.expectPrincipalReadOnly();
    await expect(modal.interestRateInput).toBeDisabled();
  });

  test("saves changes and refreshes the loan detail view", async ({ creditorPage, seededLoanId }) => {
    const detail = new LoanDetailPage(creditorPage);
    const modal = new CreateEditLoanModal(creditorPage);
    await detail.goto(seededLoanId);
    await detail.clickEditLoan();
    await modal.fillNotes("Updated notes");
    await modal.clickSave();
    await modal.expectClosed();
    await expect(detail.loanInfoCard).toContainText("Updated notes");
  });

  test("shows validation errors for invalid data", async ({ creditorPage, seededLoanId }) => {
    const detail = new LoanDetailPage(creditorPage);
    const modal = new CreateEditLoanModal(creditorPage);
    await detail.goto(seededLoanId);
    await detail.clickEditLoan();
    await modal.fillPrincipal("0");
    await modal.clickSave();
    await modal.expectFieldError("principal", "positive");
  });
});

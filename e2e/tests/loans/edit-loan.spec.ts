import { test, expect } from "../../fixtures/data.fixture";
import { LoanDetailPage } from "../../pages/LoanDetailPage";
import { CreateEditLoanModal } from "../../pages/CreateEditLoanModal";

test.describe("L2-3.3, L2-3.5: Edit Loan + Borrower Restrictions @smoke", () => {
  test("creditor can edit loan details and refresh the detail view", async ({ creditorPage, seededLoanId }) => {
    const detail = new LoanDetailPage(creditorPage);
    const modal = new CreateEditLoanModal(creditorPage);
    await detail.goto(seededLoanId);
    await detail.clickEditLoan();
    await modal.expectOpen();
    await modal.fillDescription(`Updated description ${Date.now()}`);
    await modal.fillNotes("Updated notes");
    await modal.clickSave();
    await modal.expectClosed();
    await expect(detail.loanTitle).toContainText("Updated description");
    await expect(detail.loanInfoCard).toContainText("Updated notes");
  });

  test("borrower does not get creditor-only edit controls", async ({ borrowerPage, seededLoanId }) => {
    const detail = new LoanDetailPage(borrowerPage);
    await detail.goto(seededLoanId);
    await detail.expectBorrowerRestrictions();
  });
});

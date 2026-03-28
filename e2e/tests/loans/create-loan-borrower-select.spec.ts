import { test, expect } from "../../fixtures/auth.fixture";
import { LoanListPage } from "../../pages/LoanListPage";
import { CreateEditLoanModal } from "../../pages/CreateEditLoanModal";

test.describe("L2-3.3: Borrower selection when creating a loan @smoke", () => {
  test("creditor can search for and select a borrower in the create loan modal", async ({
    creditorPage,
  }) => {
    const loanList = new LoanListPage(creditorPage);
    const modal = new CreateEditLoanModal(creditorPage);

    // Navigate to creditor loan view and open create modal
    await loanList.gotoCreditorView();
    await loanList.clickCreateLoan();
    await modal.expectOpen();
    await modal.expectTitle("Create New Loan");

    // Search for borrower by partial name
    await modal.borrowerSearchInput.fill("Sarah");
    await modal.expectBorrowerOptionsVisible();

    // Verify the expected borrower appears in the dropdown
    await expect(
      modal.borrowerOptions.filter({ hasText: "Sarah Williams" }),
    ).toBeVisible();

    // Select the borrower
    await modal.selectBorrower("Sarah Williams");

    // Verify the borrower is shown as selected
    await modal.expectBorrowerSelected("Sarah Williams");
  });
});

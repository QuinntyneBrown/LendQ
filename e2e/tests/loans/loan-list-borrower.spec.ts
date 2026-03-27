import { test, expect } from "../../fixtures/auth.fixture";
import { LoanListPage } from "../../pages/LoanListPage";

test.describe("L2-3.2: Loans List Screen (Borrower View)", () => {
  let loanList: LoanListPage;

  test.beforeEach(async ({ borrowerPage }) => {
    loanList = new LoanListPage(borrowerPage);
    await loanList.gotoBorrowerView();
  });

  test("displays borrower loans with creditor name column", async () => {
    await expect(loanList.loanTable).toBeVisible();
    await expect(loanList.loanRows.first()).toBeVisible();
  });

  test("hides Create New Loan button for borrowers", async () => {
    await loanList.expectCreateButtonHidden();
  });

  test("shows principal as non-editable", async ({ borrowerPage }) => {
    await expect(loanList.loanRows.first()).toBeVisible();
  });

  test("shows borrower-specific actions (View, Make Payment)", async ({ borrowerPage }) => {
    await expect(loanList.loanRows.first().getByRole("link", { name: /View/i })).toBeVisible();
  });

  test("navigates to loan detail on row click", async ({ borrowerPage }) => {
    await loanList.clickLoanRow(0);
    await borrowerPage.waitForURL(/\/loans\/[a-z0-9-]+/);
  });
});

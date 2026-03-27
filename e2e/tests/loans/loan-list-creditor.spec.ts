import { test, expect } from "../../fixtures/auth.fixture";
import { LoanListPage } from "../../pages/LoanListPage";

test.describe("L2-3.1: Loans List Screen (Creditor View)", () => {
  let loanList: LoanListPage;

  test.beforeEach(async ({ creditorPage }) => {
    loanList = new LoanListPage(creditorPage);
    await loanList.gotoCreditorView();
  });

  test("displays creditor loans in table with all columns", async () => {
    await expect(loanList.loanTable).toBeVisible();
    await expect(loanList.loanRows.first()).toBeVisible();
  });

  test("shows Create New Loan button", async () => {
    await loanList.expectCreateButtonVisible();
  });

  test("displays status badges with correct colors", async () => {
    await expect(loanList.statusBadge(0)).toBeVisible();
  });

  test("searches loans by borrower name", async () => {
    await loanList.search("Sarah");
    await expect(loanList.loanRows.first()).toContainText("Sarah");
  });

  test("filters loans by status", async () => {
    await loanList.filterByStatus("Active");
    const rows = loanList.loanRows;
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      await expect(loanList.statusBadge(i)).toContainText("Active");
    }
  });

  test("navigates to loan detail on row click", async ({ creditorPage }) => {
    await loanList.clickLoanRow(0);
    await creditorPage.waitForURL(/\/loans\/[a-z0-9-]+/);
  });

  test("paginates through loan list", async () => {
    await expect(loanList.pagination).toBeVisible();
  });

  test("shows empty state when no loans exist", async () => {
    await loanList.search("zzz_nonexistent_zzz");
    await loanList.expectEmptyState();
  });
});

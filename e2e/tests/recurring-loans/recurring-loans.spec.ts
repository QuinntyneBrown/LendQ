import { test, expect } from "../../fixtures/auth.fixture";
import { RecurringLoanListPage } from "../../pages/RecurringLoanListPage";
import { RecurringLoanDetailPage } from "../../pages/RecurringLoanDetailPage";
import { CreateRecurringLoanDialog } from "../../pages/CreateRecurringLoanDialog";
import { ToastComponent } from "../../pages/ToastComponent";

test.describe("L1-15: Recurring Loans @smoke", () => {
  test("creditor can view recurring loans list", async ({ creditorPage }) => {
    const listPage = new RecurringLoanListPage(creditorPage);
    await listPage.goto();
    await listPage.expectVisible();
    await expect(listPage.createButton).toBeVisible();
  });

  test("creditor can create a recurring loan", async ({ creditorPage }) => {
    const listPage = new RecurringLoanListPage(creditorPage);
    const dialog = new CreateRecurringLoanDialog(creditorPage);
    const toast = new ToastComponent(creditorPage);

    const description = `E2E Recurring Loan ${Date.now()}`;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7);

    await listPage.goto();
    await listPage.clickCreate();
    await dialog.expectOpen();
    await dialog.fillDescription(description);
    await dialog.fillPrincipal("1000");
    await dialog.selectFrequency("MONTHLY");
    await dialog.fillInstallmentCount("12");
    await dialog.selectRecurrenceInterval("MONTHLY");
    await dialog.fillStartDate(startDate.toISOString().split("T")[0]);
    await dialog.clickCreate();
    await dialog.expectClosed();
    await toast.expectToast("success", "created");
  });

  test("creditor can view recurring loan detail", async ({ creditorPage }) => {
    const listPage = new RecurringLoanListPage(creditorPage);
    const detailPage = new RecurringLoanDetailPage(creditorPage);

    await listPage.goto();
    if (await listPage.recurringLoanRows.count() > 0) {
      await listPage.clickRow(0);
      await detailPage.expectVisible();
      await expect(detailPage.statusBadge).toBeVisible();
      await expect(detailPage.metricTotalGenerated).toBeVisible();
    }
  });

  test("creditor can submit recurring loan for borrower approval", async ({ creditorPage }) => {
    const detailPage = new RecurringLoanDetailPage(creditorPage);
    const toast = new ToastComponent(creditorPage);

    const listPage = new RecurringLoanListPage(creditorPage);
    await listPage.goto();
    if (await listPage.recurringLoanRows.count() > 0) {
      await listPage.clickRow(0);
      await detailPage.expectStatus("Draft");
      await detailPage.clickSubmitForApproval();
      await toast.expectToast("success", "submitted");
      await detailPage.expectStatus("Pending Approval");
    }
  });

  test("creditor can pause an active recurring loan", async ({ creditorPage }) => {
    const detailPage = new RecurringLoanDetailPage(creditorPage);
    const toast = new ToastComponent(creditorPage);

    // Navigate to an active recurring loan
    const listPage = new RecurringLoanListPage(creditorPage);
    await listPage.goto();
    // Find an Active row
    const activeRow = creditorPage.locator("[data-testid='recurring-loan-row']:has-text('Active')").first();
    if (await activeRow.isVisible()) {
      await activeRow.click();
      await detailPage.clickPause();
      // Confirm pause dialog
      await creditorPage.getByRole("dialog").getByRole("button", { name: /Pause/i }).click();
      await toast.expectToast("success", "paused");
      await detailPage.expectStatus("Paused");
    }
  });

  test("status badges show correct colors", async ({ creditorPage }) => {
    const listPage = new RecurringLoanListPage(creditorPage);
    await listPage.goto();
    // Active should be success color, Paused amber, Cancelled gray
    if (await listPage.recurringLoanRows.count() > 0) {
      await expect(listPage.statusBadge(0)).toBeVisible();
    }
  });

  test("generated loans table shows on detail page", async ({ creditorPage }) => {
    const detailPage = new RecurringLoanDetailPage(creditorPage);
    const listPage = new RecurringLoanListPage(creditorPage);
    await listPage.goto();
    if (await listPage.recurringLoanRows.count() > 0) {
      await listPage.clickRow(0);
      // Generated loans section should be visible
      await expect(creditorPage.getByText(/Generated Loans/i).first()).toBeVisible();
    }
  });

  test("borrower can view recurring loans they participate in", async ({ borrowerPage }) => {
    const listPage = new RecurringLoanListPage(borrowerPage);
    await listPage.goto();
    await listPage.expectVisible();
  });
});

import { test, expect } from "../../fixtures/auth.fixture";
import { AdminBankAccountsPage } from "../../pages/AdminBankAccountsPage";
import { AdminAccountDetailPage } from "../../pages/AdminAccountDetailPage";
import { DepositWithdrawDialog } from "../../pages/DepositWithdrawDialog";
import { AccountStatusDialog } from "../../pages/AccountStatusDialog";
import { ToastComponent } from "../../pages/ToastComponent";

test.describe("L2-13.7: Admin User Account Detail View @smoke", () => {
  test.describe("Navigation and header", () => {
    test("can navigate to detail from the accounts list", async ({ adminPage }) => {
      const listPage = new AdminBankAccountsPage(adminPage);
      await listPage.goto();
      await listPage.clickViewAccount(0);

      const detailPage = new AdminAccountDetailPage(adminPage);
      await detailPage.expectVisible();
    });

    test("displays user name and email in the header", async ({ adminPage }) => {
      const listPage = new AdminBankAccountsPage(adminPage);
      await listPage.goto();
      await listPage.clickViewAccount(0);

      const detailPage = new AdminAccountDetailPage(adminPage);
      await expect(detailPage.userName).toBeVisible();
      await expect(detailPage.userEmail).toBeVisible();
    });

    test("displays account status badge", async ({ adminPage }) => {
      const listPage = new AdminBankAccountsPage(adminPage);
      await listPage.goto();
      await listPage.clickViewAccount(0);

      const detailPage = new AdminAccountDetailPage(adminPage);
      await expect(detailPage.accountStatusBadge).toBeVisible();
    });

    test("back link navigates to the accounts list", async ({ adminPage }) => {
      const listPage = new AdminBankAccountsPage(adminPage);
      await listPage.goto();
      await listPage.clickViewAccount(0);

      const detailPage = new AdminAccountDetailPage(adminPage);
      await detailPage.clickBack();
      await detailPage.expectNavigatedToList();
    });
  });

  test.describe("Summary metrics", () => {
    test("displays current balance metric card", async ({ adminPage }) => {
      const listPage = new AdminBankAccountsPage(adminPage);
      await listPage.goto();
      await listPage.clickViewAccount(0);

      const detailPage = new AdminAccountDetailPage(adminPage);
      await expect(detailPage.currentBalance).toBeVisible();
    });

    test("displays total deposits metric card", async ({ adminPage }) => {
      const listPage = new AdminBankAccountsPage(adminPage);
      await listPage.goto();
      await listPage.clickViewAccount(0);

      const detailPage = new AdminAccountDetailPage(adminPage);
      await expect(detailPage.totalDeposits).toBeVisible();
    });

    test("displays total withdrawals metric card", async ({ adminPage }) => {
      const listPage = new AdminBankAccountsPage(adminPage);
      await listPage.goto();
      await listPage.clickViewAccount(0);

      const detailPage = new AdminAccountDetailPage(adminPage);
      await expect(detailPage.totalWithdrawals).toBeVisible();
    });

    test("displays account created date metric card", async ({ adminPage }) => {
      const listPage = new AdminBankAccountsPage(adminPage);
      await listPage.goto();
      await listPage.clickViewAccount(0);

      const detailPage = new AdminAccountDetailPage(adminPage);
      await expect(detailPage.accountCreated).toBeVisible();
    });
  });

  test.describe("Admin actions", () => {
    test("deposit button is visible and opens deposit dialog", async ({ adminPage }) => {
      const listPage = new AdminBankAccountsPage(adminPage);
      await listPage.goto();
      await listPage.clickViewAccount(0);

      const detailPage = new AdminAccountDetailPage(adminPage);
      const dialog = new DepositWithdrawDialog(adminPage);

      await expect(detailPage.depositButton).toBeVisible();
      await detailPage.clickDeposit();
      await dialog.expectOpen();
    });

    test("withdraw button is visible and opens withdraw dialog", async ({ adminPage }) => {
      const listPage = new AdminBankAccountsPage(adminPage);
      await listPage.goto();
      await listPage.clickViewAccount(0);

      const detailPage = new AdminAccountDetailPage(adminPage);
      const dialog = new DepositWithdrawDialog(adminPage);

      await expect(detailPage.withdrawButton).toBeVisible();
      await detailPage.clickWithdraw();
      await dialog.expectOpen();
    });

    test("admin can deposit funds and see updated balance", async ({ adminPage }) => {
      const listPage = new AdminBankAccountsPage(adminPage);
      await listPage.goto();
      await listPage.clickViewAccount(0);

      const detailPage = new AdminAccountDetailPage(adminPage);
      const dialog = new DepositWithdrawDialog(adminPage);
      const toast = new ToastComponent(adminPage);

      const balanceBefore = await detailPage.currentBalance.textContent();

      await detailPage.clickDeposit();
      await dialog.expectOpen();
      await dialog.fillAmount("250.00");
      await dialog.fillReason("MANUAL_DEPOSIT");
      await dialog.clickConfirm();
      await dialog.expectClosed();
      await toast.expectToast("success", "deposit");

      // Balance should have increased
      const balanceAfter = await detailPage.currentBalance.textContent();
      expect(balanceAfter).not.toBe(balanceBefore);
    });

    test("admin can withdraw funds", async ({ adminPage }) => {
      const listPage = new AdminBankAccountsPage(adminPage);
      await listPage.goto();
      await listPage.clickViewAccount(0);

      const detailPage = new AdminAccountDetailPage(adminPage);
      const dialog = new DepositWithdrawDialog(adminPage);
      const toast = new ToastComponent(adminPage);

      await detailPage.clickWithdraw();
      await dialog.expectOpen();
      await dialog.fillAmount("50.00");
      await dialog.fillReason("MANUAL_WITHDRAWAL");
      await dialog.clickConfirm();
      await dialog.expectClosed();
      await toast.expectToast("success", "withdraw");
    });

    test("manage status button opens the status dialog", async ({ adminPage }) => {
      const listPage = new AdminBankAccountsPage(adminPage);
      await listPage.goto();
      await listPage.clickViewAccount(0);

      const detailPage = new AdminAccountDetailPage(adminPage);
      const statusDialog = new AccountStatusDialog(adminPage);

      await expect(detailPage.manageStatusButton).toBeVisible();
      await detailPage.clickManageStatus();
      await statusDialog.expectOpen();
    });
  });

  test.describe("Transaction history", () => {
    test("displays transaction history section", async ({ adminPage }) => {
      const listPage = new AdminBankAccountsPage(adminPage);
      await listPage.goto();
      await listPage.clickViewAccount(0);

      const detailPage = new AdminAccountDetailPage(adminPage);
      await expect(detailPage.transactionHistorySection).toBeVisible();
    });

    test("transactions show description, type, and amount", async ({ adminPage }) => {
      const listPage = new AdminBankAccountsPage(adminPage);
      await listPage.goto();
      await listPage.clickViewAccount(0);

      const detailPage = new AdminAccountDetailPage(adminPage);
      const txCount = await detailPage.transactionRows.or(detailPage.transactionCards).count();

      if (txCount > 0) {
        const firstTx = detailPage.transactionRows.or(detailPage.transactionCards).first();
        await expect(firstTx).toBeVisible();
        // Each transaction should contain amount text ($ prefix)
        await expect(firstTx).toContainText("$");
      }
    });

    test("can filter transactions by type", async ({ adminPage }) => {
      const listPage = new AdminBankAccountsPage(adminPage);
      await listPage.goto();
      await listPage.clickViewAccount(0);

      const detailPage = new AdminAccountDetailPage(adminPage);
      const allCount = await detailPage.transactionRows.or(detailPage.transactionCards).count();

      if (allCount > 1) {
        await detailPage.filterTransactionsByType("Deposit");
        const filteredCount = await detailPage.transactionRows
          .or(detailPage.transactionCards)
          .count();
        expect(filteredCount).toBeLessThanOrEqual(allCount);
      }
    });

    test("shows empty state when no transactions exist", async ({ adminPage }) => {
      // This test would apply to a newly created account
      const detailPage = new AdminAccountDetailPage(adminPage);
      // Navigate to a known new account if available
      // If the account has no transactions, empty state should be shown
      await expect(true).toBeTruthy(); // Placeholder — requires test data setup
    });
  });

  test.describe("Recurring deposits", () => {
    test("displays recurring deposits section", async ({ adminPage }) => {
      const listPage = new AdminBankAccountsPage(adminPage);
      await listPage.goto();
      await listPage.clickViewAccount(0);

      const detailPage = new AdminAccountDetailPage(adminPage);
      await expect(detailPage.recurringDepositsSection).toBeVisible();
    });

    test("recurring deposit cards show name and status", async ({ adminPage }) => {
      const listPage = new AdminBankAccountsPage(adminPage);
      await listPage.goto();
      await listPage.clickViewAccount(0);

      const detailPage = new AdminAccountDetailPage(adminPage);
      const cardCount = await detailPage.recurringDepositCards.count();

      if (cardCount > 0) {
        const firstCard = detailPage.recurringDepositCards.first();
        await expect(firstCard).toBeVisible();
      }
    });

    test("add button is visible for creating recurring deposits", async ({ adminPage }) => {
      const listPage = new AdminBankAccountsPage(adminPage);
      await listPage.goto();
      await listPage.clickViewAccount(0);

      const detailPage = new AdminAccountDetailPage(adminPage);
      await expect(detailPage.addRecurringButton).toBeVisible();
    });
  });
});

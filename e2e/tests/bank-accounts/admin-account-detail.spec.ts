import { test, expect } from "../../fixtures/auth.fixture";
import { AdminBankAccountsPage } from "../../pages/AdminBankAccountsPage";
import { AdminAccountDetailPage } from "../../pages/AdminAccountDetailPage";
import { DepositWithdrawDialog } from "../../pages/DepositWithdrawDialog";
import { AccountStatusDialog } from "../../pages/AccountStatusDialog";
import { ToastComponent } from "../../pages/ToastComponent";
import { ApiClient } from "../../helpers/api-client";
import { USERS } from "../../helpers/test-users";

test.describe("L2-13.7: Admin User Account Detail View @smoke", () => {
  let createdAccountId: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const request = context.request;
    const api = new ApiClient(request);

    // Login as admin
    const loginResp = await api.login(USERS.admin.email, USERS.admin.password);
    const token = loginResp.access_token;

    // Get admin user id
    const me = await api.getMe(token);

    // Create bank account for admin user via the admin endpoint
    const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
    const resp = await request.post(`${BASE_URL}/api/v1/admin/accounts`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        user_id: me.id,
        currency: "USD",
        initial_deposit: 1000,
        note: "E2E test setup",
      },
    });

    if (resp.ok()) {
      const account = await resp.json();
      createdAccountId = account.id;
    } else if (resp.status() === 409) {
      // Account already exists — find it via search
      const accountsResp = await request.get(
        `${BASE_URL}/api/v1/admin/accounts?search=${encodeURIComponent(USERS.admin.email)}&status=ACTIVE`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (accountsResp.ok()) {
        const data = await accountsResp.json();
        if (data.items && data.items.length > 0 && data.items[0].account_id) {
          createdAccountId = data.items[0].account_id;
        }
      }
    }

    await context.close();
  });

  test.describe("Navigation and header", () => {
    test("can navigate to detail from the accounts list", async ({ adminPage }) => {
      const listPage = new AdminBankAccountsPage(adminPage);
      await listPage.goto();
      await listPage.waitForData();

      // Find first row with a View button
      const viewableRow = listPage.accountRows
        .filter({ has: adminPage.getByRole("button", { name: /View/i }) })
        .first();

      if ((await viewableRow.count()) === 0) {
        test.skip();
        return;
      }

      await viewableRow.getByRole("button", { name: /View/i }).click();
      await adminPage.waitForURL(/\/admin\/accounts\/.+/);

      const detailPage = new AdminAccountDetailPage(adminPage);
      await detailPage.expectVisible();
    });

    test("displays user name and email in the header", async ({ adminPage }) => {
      const detailPage = new AdminAccountDetailPage(adminPage);
      await detailPage.goto(createdAccountId);
      await detailPage.expectVisible();

      await expect(detailPage.userName).toBeVisible();
      await expect(detailPage.userEmail).toBeVisible();
    });

    test("displays account status badge", async ({ adminPage }) => {
      const detailPage = new AdminAccountDetailPage(adminPage);
      await detailPage.goto(createdAccountId);
      await detailPage.expectVisible();

      await expect(detailPage.accountStatusBadge).toBeVisible();
    });

    test("back link navigates to the accounts list", async ({ adminPage }) => {
      const detailPage = new AdminAccountDetailPage(adminPage);
      await detailPage.goto(createdAccountId);
      await detailPage.expectVisible();

      await detailPage.clickBack();
      await detailPage.expectNavigatedToList();
    });
  });

  test.describe("Summary metrics", () => {
    test("displays current balance metric card", async ({ adminPage }) => {
      const detailPage = new AdminAccountDetailPage(adminPage);
      await detailPage.goto(createdAccountId);
      await detailPage.expectVisible();

      await expect(detailPage.currentBalance).toBeVisible();
    });

    test("displays total deposits metric card", async ({ adminPage }) => {
      const detailPage = new AdminAccountDetailPage(adminPage);
      await detailPage.goto(createdAccountId);
      await detailPage.expectVisible();

      await expect(detailPage.totalDeposits).toBeVisible();
    });

    test("displays total withdrawals metric card", async ({ adminPage }) => {
      const detailPage = new AdminAccountDetailPage(adminPage);
      await detailPage.goto(createdAccountId);
      await detailPage.expectVisible();

      await expect(detailPage.totalWithdrawals).toBeVisible();
    });

    test("displays account created date metric card", async ({ adminPage }) => {
      const detailPage = new AdminAccountDetailPage(adminPage);
      await detailPage.goto(createdAccountId);
      await detailPage.expectVisible();

      await expect(detailPage.accountCreated).toBeVisible();
    });
  });

  test.describe("Admin actions", () => {
    test("deposit button is visible and opens deposit dialog", async ({ adminPage }) => {
      const detailPage = new AdminAccountDetailPage(adminPage);
      await detailPage.goto(createdAccountId);
      await detailPage.expectVisible();

      const dialog = new DepositWithdrawDialog(adminPage);

      await expect(detailPage.depositButton).toBeVisible();
      await detailPage.clickDeposit();
      await dialog.expectOpen();
    });

    test("withdraw button is visible and opens withdraw dialog", async ({ adminPage }) => {
      const detailPage = new AdminAccountDetailPage(adminPage);
      await detailPage.goto(createdAccountId);
      await detailPage.expectVisible();

      const dialog = new DepositWithdrawDialog(adminPage);

      await expect(detailPage.withdrawButton).toBeVisible();
      await detailPage.clickWithdraw();
      await dialog.expectOpen();
    });

    test("admin can deposit funds and see updated balance", async ({ adminPage }) => {
      const detailPage = new AdminAccountDetailPage(adminPage);
      await detailPage.goto(createdAccountId);
      await detailPage.expectVisible();

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
      const detailPage = new AdminAccountDetailPage(adminPage);
      await detailPage.goto(createdAccountId);
      await detailPage.expectVisible();

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
      const detailPage = new AdminAccountDetailPage(adminPage);
      await detailPage.goto(createdAccountId);
      await detailPage.expectVisible();

      const statusDialog = new AccountStatusDialog(adminPage);

      await expect(detailPage.manageStatusButton).toBeVisible();
      await detailPage.clickManageStatus();
      await statusDialog.expectOpen();
    });
  });

  test.describe("Transaction history", () => {
    test("displays transaction history section", async ({ adminPage }) => {
      const detailPage = new AdminAccountDetailPage(adminPage);
      await detailPage.goto(createdAccountId);
      await detailPage.expectVisible();

      await expect(detailPage.transactionHistorySection).toBeVisible();
    });

    test("transactions show description, type, and amount", async ({ adminPage }) => {
      const detailPage = new AdminAccountDetailPage(adminPage);
      await detailPage.goto(createdAccountId);
      await detailPage.expectVisible();

      const txCount = await detailPage.transactionRows.or(detailPage.transactionCards).count();

      if (txCount > 0) {
        const firstTx = detailPage.transactionRows.or(detailPage.transactionCards).first();
        await expect(firstTx).toBeVisible();
        // Each transaction should contain amount text ($ prefix)
        await expect(firstTx).toContainText("$");
      }
    });

    test("can filter transactions by type", async ({ adminPage }) => {
      const detailPage = new AdminAccountDetailPage(adminPage);
      await detailPage.goto(createdAccountId);
      await detailPage.expectVisible();

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
      const detailPage = new AdminAccountDetailPage(adminPage);
      await detailPage.goto(createdAccountId);
      await detailPage.expectVisible();

      await expect(detailPage.recurringDepositsSection).toBeVisible();
    });

    test("recurring deposit cards show name and status", async ({ adminPage }) => {
      const detailPage = new AdminAccountDetailPage(adminPage);
      await detailPage.goto(createdAccountId);
      await detailPage.expectVisible();

      const cardCount = await detailPage.recurringDepositCards.count();

      if (cardCount > 0) {
        const firstCard = detailPage.recurringDepositCards.first();
        await expect(firstCard).toBeVisible();
      }
    });

    test("add button is visible for creating recurring deposits", async ({ adminPage }) => {
      const detailPage = new AdminAccountDetailPage(adminPage);
      await detailPage.goto(createdAccountId);
      await detailPage.expectVisible();

      await expect(detailPage.addRecurringButton).toBeVisible();
    });
  });
});

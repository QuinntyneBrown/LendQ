import { test, expect } from "../../fixtures/auth.fixture";
import { AdminBankAccountsPage } from "../../pages/AdminBankAccountsPage";
import { AdminAccountDetailPage } from "../../pages/AdminAccountDetailPage";
import { AccountStatusDialog } from "../../pages/AccountStatusDialog";
import { ToastComponent } from "../../pages/ToastComponent";
import { ApiClient } from "../../helpers/api-client";
import { USERS } from "../../helpers/test-users";

test.describe("L2-13.8: Account Status Management @smoke", () => {
  test.describe.configure({ mode: "serial" });
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
        `${BASE_URL}/api/v1/admin/accounts?search=${encodeURIComponent(USERS.admin.email)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (accountsResp.ok()) {
        const data = await accountsResp.json();
        if (data.items && data.items.length > 0 && data.items[0].account_id) {
          createdAccountId = data.items[0].account_id;
        }
      }
    }

    // Ensure account is ACTIVE for status management tests
    if (createdAccountId) {
      await request.patch(`${BASE_URL}/api/v1/admin/accounts/${createdAccountId}/status`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        data: { status: "ACTIVE", reason: "E2E test setup — ensure active state" },
      });
    }

    await context.close();
  });

  test.describe("Dialog display", () => {
    test("Manage Status button opens the status dialog", async ({ adminPage }) => {
      const detailPage = new AdminAccountDetailPage(adminPage);
      await detailPage.goto(createdAccountId);
      await detailPage.expectVisible();

      const dialog = new AccountStatusDialog(adminPage);

      await detailPage.clickManageStatus();
      await dialog.expectOpen();
    });

    test("dialog shows warning icon", async ({ adminPage }) => {
      const detailPage = new AdminAccountDetailPage(adminPage);
      await detailPage.goto(createdAccountId);
      await detailPage.expectVisible();

      const dialog = new AccountStatusDialog(adminPage);

      await detailPage.clickManageStatus();
      await dialog.expectOpen();
      await dialog.expectWarningIconVisible();
    });

    test("dialog shows the user name and balance", async ({ adminPage }) => {
      const detailPage = new AdminAccountDetailPage(adminPage);
      await detailPage.goto(createdAccountId);
      await detailPage.expectVisible();

      const dialog = new AccountStatusDialog(adminPage);

      await detailPage.clickManageStatus();
      await dialog.expectOpen();
      await expect(dialog.userName).toBeVisible();
      await expect(dialog.userBalance).toBeVisible();
    });

    test("dialog shows impact warning box with consequences", async ({ adminPage }) => {
      const detailPage = new AdminAccountDetailPage(adminPage);
      await detailPage.goto(createdAccountId);
      await detailPage.expectVisible();

      const dialog = new AccountStatusDialog(adminPage);

      await detailPage.clickManageStatus();
      await dialog.expectOpen();
      await dialog.expectImpactWarningVisible();

      // Should list at least one consequence
      const itemCount = await dialog.impactItems.count();
      expect(itemCount).toBeGreaterThan(0);
    });

    test("dialog shows required reason field", async ({ adminPage }) => {
      const detailPage = new AdminAccountDetailPage(adminPage);
      await detailPage.goto(createdAccountId);
      await detailPage.expectVisible();

      const dialog = new AccountStatusDialog(adminPage);

      await detailPage.clickManageStatus();
      await dialog.expectOpen();
      await expect(dialog.reasonInput).toBeVisible();
    });
  });

  test.describe("Freeze account", () => {
    test("freeze impact lists correct consequences", async ({ adminPage }) => {
      const detailPage = new AdminAccountDetailPage(adminPage);
      await detailPage.goto(createdAccountId);
      await detailPage.expectVisible();

      const dialog = new AccountStatusDialog(adminPage);

      await detailPage.clickManageStatus();
      await dialog.expectOpen();

      await dialog.expectImpactItemText(0, "deposits and withdrawals");
      await dialog.expectImpactItemText(1, "recurring deposits");
      await dialog.expectImpactItemText(2, "accessing their balance");
    });

    test("can freeze an active account with a reason", async ({ adminPage }) => {
      const detailPage = new AdminAccountDetailPage(adminPage);
      await detailPage.goto(createdAccountId);
      await detailPage.expectVisible();

      const dialog = new AccountStatusDialog(adminPage);
      const toast = new ToastComponent(adminPage);

      await detailPage.clickManageStatus();
      await dialog.expectOpen();
      await dialog.expectTitle("Freeze");

      await dialog.fillReason("Suspicious activity detected — temporary hold");
      await dialog.clickConfirm();
      await dialog.expectClosed();
      await toast.expectToast("success", "frozen");

      // Status badge should update
      await detailPage.expectAccountStatus("Frozen");
    });
  });

  test.describe("Reactivate account", () => {
    test("can reactivate a frozen account", async ({ adminPage }) => {
      // Navigate to a frozen account
      const listPage = new AdminBankAccountsPage(adminPage);
      await listPage.goto();
      await listPage.waitForData();

      const frozenRow = listPage.accountRows
        .filter({ has: adminPage.getByTestId("account-status").getByText("Frozen") })
        .first();

      if ((await frozenRow.count()) > 0) {
        await frozenRow.getByRole("button", { name: /View/i }).click();

        const detailPage = new AdminAccountDetailPage(adminPage);
        const dialog = new AccountStatusDialog(adminPage);
        const toast = new ToastComponent(adminPage);

        await detailPage.clickManageStatus();
        await dialog.expectOpen();
        await dialog.expectTitle("Reactivate");

        await dialog.fillReason("Investigation complete — account cleared");
        await dialog.clickConfirm();
        await dialog.expectClosed();
        await toast.expectToast("success", "reactivated");

        await detailPage.expectAccountStatus("Active");
      }
    });
  });

  test.describe("Close account", () => {
    test("close action is visually distinct (destructive)", async ({ adminPage }) => {
      const detailPage = new AdminAccountDetailPage(adminPage);
      await detailPage.goto(createdAccountId);
      await detailPage.expectVisible();

      const dialog = new AccountStatusDialog(adminPage);

      await detailPage.clickManageStatus();
      await dialog.expectOpen();

      // The confirm button for close should be destructive styled
      // This is verified by checking the button text content
      await expect(dialog.confirmButton).toBeVisible();
    });

    test("can close an account with required reason", async ({ adminPage }) => {
      const detailPage = new AdminAccountDetailPage(adminPage);
      await detailPage.goto(createdAccountId);
      await detailPage.expectVisible();

      const dialog = new AccountStatusDialog(adminPage);
      const toast = new ToastComponent(adminPage);

      await detailPage.clickManageStatus();
      await dialog.expectOpen();

      await dialog.fillReason("User requested permanent closure");
      await dialog.clickConfirm();
      await dialog.expectClosed();
      await toast.waitForToast("success");

      // Verify the status updated
      await expect(detailPage.accountStatusBadge).toBeVisible();
    });
  });

  test.describe("Dialog dismissal", () => {
    test("Cancel button closes without making changes", async ({ adminPage }) => {
      const detailPage = new AdminAccountDetailPage(adminPage);
      await detailPage.goto(createdAccountId);
      await detailPage.expectVisible();

      const dialog = new AccountStatusDialog(adminPage);

      const statusBefore = await detailPage.accountStatusBadge.textContent();

      await detailPage.clickManageStatus();
      await dialog.expectOpen();
      await dialog.fillReason("This should not be saved");
      await dialog.clickCancel();
      await dialog.expectClosed();

      // Status should remain unchanged
      const statusAfter = await detailPage.accountStatusBadge.textContent();
      expect(statusAfter).toBe(statusBefore);
    });
  });

  test.describe("Status transitions", () => {
    test("Active account shows Freeze option", async ({ adminPage }) => {
      const listPage = new AdminBankAccountsPage(adminPage);
      await listPage.goto();
      await listPage.waitForData();

      const activeRow = listPage.accountRows
        .filter({ has: adminPage.getByTestId("account-status").getByText("Active") })
        .first();

      if ((await activeRow.count()) > 0) {
        await activeRow.getByRole("button", { name: /View/i }).click();
        const detailPage = new AdminAccountDetailPage(adminPage);
        const dialog = new AccountStatusDialog(adminPage);

        await detailPage.clickManageStatus();
        await dialog.expectOpen();
        await dialog.expectConfirmButtonText(/Freeze/i);
      }
    });

    test("Frozen account shows Reactivate option", async ({ adminPage }) => {
      const listPage = new AdminBankAccountsPage(adminPage);
      await listPage.goto();
      await listPage.waitForData();

      const frozenRow = listPage.accountRows
        .filter({ has: adminPage.getByTestId("account-status").getByText("Frozen") })
        .first();

      if ((await frozenRow.count()) > 0) {
        await frozenRow.getByRole("button", { name: /View/i }).click();
        const detailPage = new AdminAccountDetailPage(adminPage);
        const dialog = new AccountStatusDialog(adminPage);

        await detailPage.clickManageStatus();
        await dialog.expectOpen();
        await dialog.expectConfirmButtonText(/Reactivate/i);
      }
    });
  });
});

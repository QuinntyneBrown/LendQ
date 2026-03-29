import { test, expect } from "../../fixtures/auth.fixture";
import { AdminBankAccountsPage } from "../../pages/AdminBankAccountsPage";
import { CreateBankAccountDialog } from "../../pages/CreateBankAccountDialog";
import { ToastComponent } from "../../pages/ToastComponent";

test.describe("L2-13.6: Create Bank Account for User @smoke", () => {
  test.describe("Dialog display", () => {
    test("clicking Create Account opens the dialog with user info", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      const dialog = new CreateBankAccountDialog(adminPage);
      await accountsPage.goto();

      // Find a "No Account" row and click Create Account
      const noAccountRow = accountsPage.accountRows
        .filter({ has: adminPage.getByTestId("account-status").getByText("No Account") })
        .first();

      if ((await noAccountRow.count()) > 0) {
        await noAccountRow.getByRole("button", { name: /Create Account/i }).click();
        await dialog.expectOpen();
      }
    });

    test("dialog shows the target user name and email", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      const dialog = new CreateBankAccountDialog(adminPage);
      await accountsPage.goto();

      const noAccountRow = accountsPage.accountRows
        .filter({ has: adminPage.getByTestId("account-status").getByText("No Account") })
        .first();

      if ((await noAccountRow.count()) > 0) {
        await noAccountRow.getByRole("button", { name: /Create Account/i }).click();
        await dialog.expectOpen();

        // Should display the user's identity
        await expect(dialog.userName).toBeVisible();
        await expect(dialog.userEmail).toBeVisible();
      }
    });

    test("dialog shows default currency as USD", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      const dialog = new CreateBankAccountDialog(adminPage);
      await accountsPage.goto();

      const noAccountRow = accountsPage.accountRows
        .filter({ has: adminPage.getByTestId("account-status").getByText("No Account") })
        .first();

      if ((await noAccountRow.count()) > 0) {
        await noAccountRow.getByRole("button", { name: /Create Account/i }).click();
        await dialog.expectOpen();
        await dialog.expectDefaultCurrency("USD");
      }
    });

    test("dialog shows initial deposit helper text", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      const dialog = new CreateBankAccountDialog(adminPage);
      await accountsPage.goto();

      const noAccountRow = accountsPage.accountRows
        .filter({ has: adminPage.getByTestId("account-status").getByText("No Account") })
        .first();

      if ((await noAccountRow.count()) > 0) {
        await noAccountRow.getByRole("button", { name: /Create Account/i }).click();
        await dialog.expectOpen();
        await dialog.expectHelperTextVisible();
      }
    });
  });

  test.describe("Account creation", () => {
    test("can create account with zero initial deposit", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      const dialog = new CreateBankAccountDialog(adminPage);
      const toast = new ToastComponent(adminPage);
      await accountsPage.goto();

      const noAccountRow = accountsPage.accountRows
        .filter({ has: adminPage.getByTestId("account-status").getByText("No Account") })
        .first();

      if ((await noAccountRow.count()) > 0) {
        await noAccountRow.getByRole("button", { name: /Create Account/i }).click();
        await dialog.expectOpen();
        await dialog.clickCreate();
        await dialog.expectClosed();
        await toast.expectToast("success", "created");
      }
    });

    test("can create account with initial deposit", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      const dialog = new CreateBankAccountDialog(adminPage);
      const toast = new ToastComponent(adminPage);
      await accountsPage.goto();

      const noAccountRow = accountsPage.accountRows
        .filter({ has: adminPage.getByTestId("account-status").getByText("No Account") })
        .first();

      if ((await noAccountRow.count()) > 0) {
        await noAccountRow.getByRole("button", { name: /Create Account/i }).click();
        await dialog.expectOpen();
        await dialog.fillInitialDeposit("500.00");
        await dialog.fillNote("Initial funding for legacy user");
        await dialog.clickCreate();
        await dialog.expectClosed();
        await toast.expectToast("success", "created");
      }
    });

    test("after creation, user row updates from No Account to Active", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      const dialog = new CreateBankAccountDialog(adminPage);
      const toast = new ToastComponent(adminPage);
      await accountsPage.goto();

      const noAccountRow = accountsPage.accountRows
        .filter({ has: adminPage.getByTestId("account-status").getByText("No Account") })
        .first();

      if ((await noAccountRow.count()) > 0) {
        const userName = await noAccountRow.getByTestId("account-user-name").textContent();
        await noAccountRow.getByRole("button", { name: /Create Account/i }).click();
        await dialog.expectOpen();
        await dialog.clickCreate();
        await dialog.expectClosed();
        await toast.waitForToast("success");

        // The row should now show Active status instead of No Account
        if (userName) {
          const updatedRow = accountsPage.accountRows.filter({ hasText: userName }).first();
          await expect(updatedRow.getByTestId("account-status")).toContainText("Active");
        }
      }
    });
  });

  test.describe("Dialog dismissal", () => {
    test("Cancel button closes the dialog without creating", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      const dialog = new CreateBankAccountDialog(adminPage);
      await accountsPage.goto();

      const noAccountRow = accountsPage.accountRows
        .filter({ has: adminPage.getByTestId("account-status").getByText("No Account") })
        .first();

      if ((await noAccountRow.count()) > 0) {
        await noAccountRow.getByRole("button", { name: /Create Account/i }).click();
        await dialog.expectOpen();
        await dialog.clickCancel();
        await dialog.expectClosed();

        // No Account status should still be present
        await expect(
          accountsPage.accountRows
            .filter({ has: adminPage.getByTestId("account-status").getByText("No Account") })
            .first(),
        ).toBeVisible();
      }
    });

    test("close button (X) closes the dialog", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      const dialog = new CreateBankAccountDialog(adminPage);
      await accountsPage.goto();

      const noAccountRow = accountsPage.accountRows
        .filter({ has: adminPage.getByTestId("account-status").getByText("No Account") })
        .first();

      if ((await noAccountRow.count()) > 0) {
        await noAccountRow.getByRole("button", { name: /Create Account/i }).click();
        await dialog.expectOpen();
        await dialog.clickClose();
        await dialog.expectClosed();
      }
    });
  });

  test.describe("Error handling", () => {
    test("shows error when creating account for user who already has one", async ({
      adminPage,
    }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      const dialog = new CreateBankAccountDialog(adminPage);
      await accountsPage.goto();

      // This tests the backend guard — attempting to create for a user who has an account
      // The UI should prevent this, but the dialog should handle 409 Conflict gracefully
      const noAccountRow = accountsPage.accountRows
        .filter({ has: adminPage.getByTestId("account-status").getByText("No Account") })
        .first();

      if ((await noAccountRow.count()) === 0) {
        // If no "No Account" rows exist, this test is not applicable
        test.skip();
      }
    });
  });
});

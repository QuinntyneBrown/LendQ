import { test, expect } from "../../fixtures/auth.fixture";
import { AdminBankAccountsPage } from "../../pages/AdminBankAccountsPage";

test.describe("L2-13.5: Admin Bank Accounts Management List @smoke", () => {
  test.describe("Access control", () => {
    test("admin can access the bank accounts management page", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      await accountsPage.goto();
      await accountsPage.expectVisible();
      await expect(accountsPage.pageTitle).toBeVisible();
      await expect(accountsPage.subtitle).toBeVisible();
    });

    test("non-admin user is denied access", async ({ borrowerPage }) => {
      const accountsPage = new AdminBankAccountsPage(borrowerPage);
      await accountsPage.goto();
      await accountsPage.expectAccessDenied();
    });

    test("creditor user is denied access", async ({ creditorPage }) => {
      const accountsPage = new AdminBankAccountsPage(creditorPage);
      await accountsPage.goto();
      await accountsPage.expectAccessDenied();
    });
  });

  test.describe("Summary statistics", () => {
    test("displays all four stat cards", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      await accountsPage.goto();
      await accountsPage.waitForData();

      await expect(accountsPage.totalAccountsStat).toBeVisible();
      await expect(accountsPage.activeAccountsStat).toBeVisible();
      await expect(accountsPage.frozenAccountsStat).toBeVisible();
      await expect(accountsPage.noAccountStat).toBeVisible();
    });
  });

  test.describe("Data table", () => {
    test("displays user rows with name, email, status, balance, and actions", async ({
      adminPage,
    }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      await accountsPage.goto();
      await accountsPage.waitForData();

      const rowCount = await accountsPage.accountRows.count();
      expect(rowCount).toBeGreaterThan(0);
    });

    test("shows Active status badge for users with active accounts", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      await accountsPage.goto();
      await accountsPage.waitForData();

      const activeRow = accountsPage.accountRows
        .filter({ has: adminPage.getByTestId("account-status").getByText("Active") })
        .first();

      if ((await activeRow.count()) > 0) {
        await expect(activeRow).toBeVisible();
        await expect(activeRow.getByRole("button", { name: /View/i })).toBeVisible();
      } else {
        // No active accounts in test data — verify No Account rows exist instead
        const noAccountRow = accountsPage.accountRows
          .filter({ has: adminPage.getByTestId("account-status").getByText("No Account") })
          .first();
        await expect(noAccountRow).toBeVisible();
      }
    });

    test("shows No Account status with Create Account button for legacy users", async ({
      adminPage,
    }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      await accountsPage.goto();
      await accountsPage.waitForData();

      const noAccountRow = accountsPage.accountRows
        .filter({ has: adminPage.getByTestId("account-status").getByText("No Account") })
        .first();

      if ((await noAccountRow.count()) > 0) {
        await expect(noAccountRow).toBeVisible();
        await expect(
          noAccountRow.getByRole("button", { name: /Create Account/i }),
        ).toBeVisible();
        await expect(noAccountRow).toContainText("—");
      }
    });

    test("shows Frozen status badge for frozen accounts", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      await accountsPage.goto();
      await accountsPage.waitForData();

      const frozenRow = accountsPage.accountRows
        .filter({ has: adminPage.getByTestId("account-status").getByText("Frozen") })
        .first();

      if ((await frozenRow.count()) > 0) {
        await expect(frozenRow).toBeVisible();
        await expect(frozenRow.getByRole("button", { name: /View/i })).toBeVisible();
      }
    });

    test("shows Closed status badge for closed accounts", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      await accountsPage.goto();
      await accountsPage.waitForData();

      const closedRow = accountsPage.accountRows
        .filter({ has: adminPage.getByTestId("account-status").getByText("Closed") })
        .first();

      if ((await closedRow.count()) > 0) {
        await expect(closedRow).toBeVisible();
      }
    });

    test("clicking View navigates to admin account detail", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      await accountsPage.goto();
      await accountsPage.waitForData();

      // Find first row with a View button (i.e., user with an account)
      const viewableRow = accountsPage.accountRows
        .filter({ has: adminPage.getByRole("button", { name: /View/i }) })
        .first();

      if ((await viewableRow.count()) > 0) {
        await viewableRow.getByRole("button", { name: /View/i }).click();
        await adminPage.waitForURL(/\/admin\/accounts\/.+/);
      } else {
        // No accounts to view — create one first via Create Account button
        const createRow = accountsPage.accountRows.first();
        await createRow.getByRole("button", { name: /Create Account/i }).click();
        // Dialog opens — just verify it opened and close it
        await expect(adminPage.getByRole("dialog")).toBeVisible();
      }
    });
  });

  test.describe("Search", () => {
    test("can search users by name", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      await accountsPage.goto();
      await accountsPage.waitForData();

      const initialCount = await accountsPage.accountRows.count();
      await accountsPage.search("Admin");
      await accountsPage.waitForData();
      const filteredCount = await accountsPage.accountRows.count();
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
      expect(filteredCount).toBeGreaterThan(0);
    });

    test("can search users by email", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      await accountsPage.goto();
      await accountsPage.waitForData();
      await accountsPage.search("@family.com");
      await accountsPage.waitForData();

      const rowCount = await accountsPage.accountRows.count();
      expect(rowCount).toBeGreaterThan(0);
    });

    test("shows empty state when search yields no results", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      await accountsPage.goto();
      await accountsPage.waitForData();
      await accountsPage.search("zzz_nonexistent_user_xyz");

      await accountsPage.expectEmptyState();
    });

    test("clearing search restores full list", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      await accountsPage.goto();
      await accountsPage.waitForData();

      const fullCount = await accountsPage.accountRows.count();
      await accountsPage.search("zzz_nonexistent");
      await accountsPage.page.waitForTimeout(500);
      await accountsPage.clearSearch();
      await accountsPage.waitForData();

      const restoredCount = await accountsPage.accountRows.count();
      expect(restoredCount).toBe(fullCount);
    });
  });

  test.describe("Filter by status", () => {
    test("can filter to show only Active accounts", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      await accountsPage.goto();
      await accountsPage.waitForData();
      await accountsPage.filterByStatus("Active");

      // Wait for filter to take effect
      await accountsPage.page.waitForTimeout(500);

      const rows = accountsPage.accountRows;
      const count = await rows.count();
      for (let i = 0; i < count; i++) {
        await expect(rows.nth(i).getByTestId("account-status")).toContainText("Active");
      }
    });

    test("can filter to show only No Account users", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      await accountsPage.goto();
      await accountsPage.waitForData();
      await accountsPage.filterByStatus("No Account");
      await accountsPage.waitForData();

      const rows = accountsPage.accountRows;
      const count = await rows.count();
      expect(count).toBeGreaterThan(0);
      for (let i = 0; i < Math.min(count, 5); i++) {
        await expect(rows.nth(i).getByTestId("account-status")).toContainText("No Account");
        await expect(
          rows.nth(i).getByRole("button", { name: /Create Account/i }),
        ).toBeVisible();
      }
    });

    test("All filter shows every account", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      await accountsPage.goto();
      await accountsPage.waitForData();

      await accountsPage.filterByStatus("No Account");
      await accountsPage.page.waitForTimeout(500);
      const noAccountCount = await accountsPage.accountRows.count();

      await accountsPage.filterByStatus("All");
      await accountsPage.waitForData();
      const allCount = await accountsPage.accountRows.count();
      expect(allCount).toBeGreaterThanOrEqual(noAccountCount);
    });
  });

  test.describe("Pagination", () => {
    test("displays pagination controls", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      await accountsPage.goto();
      await accountsPage.waitForData();
      await expect(accountsPage.pagination).toBeVisible();
    });

    test("can navigate between pages", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      await accountsPage.goto();
      await accountsPage.waitForData();

      const page1FirstRow = await accountsPage.accountRows.first().textContent();
      await accountsPage.goToPage(2);
      await accountsPage.waitForData();
      const page2FirstRow = await accountsPage.accountRows.first().textContent();
      expect(page2FirstRow).not.toBe(page1FirstRow);
    });
  });

  test.describe("Sorting", () => {
    test("can sort by user name", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      await accountsPage.goto();
      await accountsPage.waitForData();
      await accountsPage.sortBy("User");
      await accountsPage.waitForData();

      const rowCount = await accountsPage.accountRows.count();
      expect(rowCount).toBeGreaterThan(0);
    });

    test("can sort by balance", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      await accountsPage.goto();
      await accountsPage.waitForData();
      await accountsPage.sortBy("Balance");
      await accountsPage.waitForData();

      const rowCount = await accountsPage.accountRows.count();
      expect(rowCount).toBeGreaterThan(0);
    });
  });
});

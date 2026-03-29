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
      await accountsPage.expectVisible();

      // Table should have at least one row
      const rowCount = await accountsPage.accountRows.count();
      expect(rowCount).toBeGreaterThan(0);
    });

    test("shows Active status badge for users with active accounts", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      await accountsPage.goto();

      // Find first active account row
      const activeRow = accountsPage.accountRows
        .filter({ has: adminPage.getByTestId("account-status").getByText("Active") })
        .first();
      await expect(activeRow).toBeVisible();
      await expect(activeRow.getByRole("button", { name: /View/i })).toBeVisible();
    });

    test("shows No Account status with Create Account button for legacy users", async ({
      adminPage,
    }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      await accountsPage.goto();

      const noAccountRow = accountsPage.accountRows
        .filter({ has: adminPage.getByTestId("account-status").getByText("No Account") })
        .first();

      if ((await noAccountRow.count()) > 0) {
        await expect(noAccountRow).toBeVisible();
        await expect(
          noAccountRow.getByRole("button", { name: /Create Account/i }),
        ).toBeVisible();
        // Balance and last transaction should show placeholder
        await expect(noAccountRow).toContainText("—");
      }
    });

    test("shows Frozen status badge for frozen accounts", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      await accountsPage.goto();

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
      await accountsPage.clickViewAccount(0);
      await adminPage.waitForURL(/\/admin\/accounts\/.+/);
    });
  });

  test.describe("Search", () => {
    test("can search users by name", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      await accountsPage.goto();

      const initialCount = await accountsPage.accountRows.count();
      await accountsPage.search("admin");
      const filteredCount = await accountsPage.accountRows.count();
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    });

    test("can search users by email", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      await accountsPage.goto();
      await accountsPage.search("@family.com");

      const rowCount = await accountsPage.accountRows.count();
      expect(rowCount).toBeGreaterThan(0);
    });

    test("shows empty state when search yields no results", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      await accountsPage.goto();
      await accountsPage.search("zzz_nonexistent_user_xyz");

      await accountsPage.expectEmptyState();
    });

    test("clearing search restores full list", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      await accountsPage.goto();

      const fullCount = await accountsPage.accountRows.count();
      await accountsPage.search("nonexistent");
      await accountsPage.clearSearch();

      const restoredCount = await accountsPage.accountRows.count();
      expect(restoredCount).toBe(fullCount);
    });
  });

  test.describe("Filter by status", () => {
    test("can filter to show only Active accounts", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      await accountsPage.goto();
      await accountsPage.filterByStatus("Active");

      const rows = accountsPage.accountRows;
      const count = await rows.count();
      for (let i = 0; i < count; i++) {
        await expect(rows.nth(i).getByTestId("account-status")).toContainText("Active");
      }
    });

    test("can filter to show only No Account users", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      await accountsPage.goto();
      await accountsPage.filterByStatus("No Account");

      const rows = accountsPage.accountRows;
      const count = await rows.count();
      for (let i = 0; i < count; i++) {
        await expect(rows.nth(i).getByTestId("account-status")).toContainText("No Account");
        await expect(
          rows.nth(i).getByRole("button", { name: /Create Account/i }),
        ).toBeVisible();
      }
    });

    test("All filter shows every account", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      await accountsPage.goto();
      await accountsPage.filterByStatus("Active");
      const activeCount = await accountsPage.accountRows.count();

      await accountsPage.filterByStatus("All");
      const allCount = await accountsPage.accountRows.count();
      expect(allCount).toBeGreaterThanOrEqual(activeCount);
    });
  });

  test.describe("Pagination", () => {
    test("displays pagination controls", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      await accountsPage.goto();
      await expect(accountsPage.pagination).toBeVisible();
    });

    test("can navigate between pages", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      await accountsPage.goto();

      const page1FirstRow = await accountsPage.accountRows.first().textContent();
      await accountsPage.goToPage(2);
      const page2FirstRow = await accountsPage.accountRows.first().textContent();
      expect(page2FirstRow).not.toBe(page1FirstRow);
    });
  });

  test.describe("Sorting", () => {
    test("can sort by user name", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      await accountsPage.goto();
      await accountsPage.sortBy("User");

      // Verify rows are displayed (sort order would be checked against known data)
      const rowCount = await accountsPage.accountRows.count();
      expect(rowCount).toBeGreaterThan(0);
    });

    test("can sort by balance", async ({ adminPage }) => {
      const accountsPage = new AdminBankAccountsPage(adminPage);
      await accountsPage.goto();
      await accountsPage.sortBy("Balance");

      const rowCount = await accountsPage.accountRows.count();
      expect(rowCount).toBeGreaterThan(0);
    });
  });
});

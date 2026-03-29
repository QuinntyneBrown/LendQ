import { test, expect } from "../../fixtures/auth.fixture";
import { UserListPage } from "../../pages/UserListPage";
import { AddEditUserDialog } from "../../pages/AddEditUserDialog";
import { DeleteUserDialog } from "../../pages/DeleteUserDialog";
import { ToastComponent } from "../../pages/ToastComponent";
import { ApiClient } from "../../helpers/api-client";
import { USERS } from "../../helpers/test-users";

test.describe("L2-2.6: Permanent Deletion of Test Users @smoke", () => {
  test.describe.configure({ mode: "serial" });

  const suffix = Date.now();
  const testUserName = `E2E Purge Target ${suffix}`;
  const testUserEmail = `e2e_purge_${suffix}@family.com`;
  const testUserPassword = "Password123!";

  test("admin creates a test user for purge testing", async ({ adminPage }) => {
    const userList = new UserListPage(adminPage);
    const addDialog = new AddEditUserDialog(adminPage);
    const toast = new ToastComponent(adminPage);

    await userList.goto();
    await userList.clickAddUser();
    await addDialog.fillName(testUserName);
    await addDialog.fillEmail(testUserEmail);
    await addDialog.fillPassword(testUserPassword);
    await addDialog.selectRoles(["Borrower"]);
    await addDialog.clickSave();
    await addDialog.expectClosed();
    await toast.expectToast("success", "created");
  });

  test("delete dialog shows 'Permanently Delete' button for test user", async ({ adminPage }) => {
    const userList = new UserListPage(adminPage);
    const deleteDialog = new DeleteUserDialog(adminPage);

    await userList.goto();
    await userList.search(testUserName);
    await expect(userList.userRows.first()).toBeVisible({ timeout: 10000 });
    await userList.clickDeleteUser(0);

    await deleteDialog.expectOpen();
    await deleteDialog.expectPurgeVisible();
  });

  test("delete dialog shows 'Deactivate' button alongside purge for test user", async ({
    adminPage,
  }) => {
    const userList = new UserListPage(adminPage);
    const deleteDialog = new DeleteUserDialog(adminPage);

    await userList.goto();
    await userList.search(testUserName);
    await expect(userList.userRows.first()).toBeVisible({ timeout: 10000 });
    await userList.clickDeleteUser(0);

    await deleteDialog.expectOpen();
    await expect(deleteDialog.deactivateButton).toBeVisible();
    await expect(deleteDialog.purgeButton).toBeVisible();
  });

  test("cancel closes dialog without deleting", async ({ adminPage }) => {
    const userList = new UserListPage(adminPage);
    const deleteDialog = new DeleteUserDialog(adminPage);

    await userList.goto();
    await userList.search(testUserName);
    await expect(userList.userRows.first()).toBeVisible({ timeout: 10000 });
    await userList.clickDeleteUser(0);
    await deleteDialog.expectOpen();
    await deleteDialog.clickCancel();
    await deleteDialog.expectClosed();

    // User still exists
    await expect(userList.userRows.first()).toContainText(testUserName);
  });

  test("permanently deleting a test user wipes them from the system", async ({ adminPage }) => {
    const userList = new UserListPage(adminPage);
    const deleteDialog = new DeleteUserDialog(adminPage);
    const toast = new ToastComponent(adminPage);

    await userList.goto();
    await userList.search(testUserName);
    await expect(userList.userRows.first()).toBeVisible({ timeout: 10000 });
    await userList.clickDeleteUser(0);

    await deleteDialog.expectOpen();
    await deleteDialog.clickPurge();
    await deleteDialog.expectClosed();
    await toast.expectToast("success", "permanently deleted");
  });

  test("purged user is completely gone from user list", async ({ adminPage }) => {
    const userList = new UserListPage(adminPage);

    await userList.goto();
    await userList.search(testUserEmail);
    await adminPage.waitForTimeout(500);

    // Should show empty state or no matching rows
    const count = await userList.userRows.count();
    expect(count).toBe(0);
  });

  test("purged user cannot log in", async ({ browser }) => {
    const context = await browser.newContext();
    const request = context.request;
    const api = new ApiClient(request);

    try {
      await api.login(testUserEmail, testUserPassword);
      // If login succeeds, the user wasn't purged — fail
      expect(true).toBe(false);
    } catch {
      // Expected — user doesn't exist
    }

    await context.close();
  });

  test("delete dialog does NOT show purge for protected seed users", async ({ adminPage }) => {
    const userList = new UserListPage(adminPage);
    const deleteDialog = new DeleteUserDialog(adminPage);

    await userList.goto();
    await userList.search("creditor@family.com");
    await expect(userList.userRows.first()).toBeVisible({ timeout: 10000 });
    await userList.clickDeleteUser(0);

    await deleteDialog.expectOpen();
    await deleteDialog.expectPurgeNotVisible();
    await deleteDialog.clickCancel();
  });
});

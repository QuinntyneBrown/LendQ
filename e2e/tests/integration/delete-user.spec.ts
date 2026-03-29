import { test, expect } from "../../fixtures/auth.fixture";
import { UserListPage } from "../../pages/UserListPage";
import { AddEditUserDialog } from "../../pages/AddEditUserDialog";
import { DeleteUserDialog } from "../../pages/DeleteUserDialog";
import { ToastComponent } from "../../pages/ToastComponent";
import { LoginPage } from "../../pages/LoginPage";
import { ApiClient } from "../../helpers/api-client";
import { USERS } from "../../helpers/test-users";

test.describe("Delete User Flow @smoke", () => {
  const suffix = Date.now();
  const testUserName = `E2E Removal Test ${suffix}`;
  const testUserEmail = `e2eremoval_${suffix}@family.com`;
  const testUserPassword = "Password123!";

  test.describe.configure({ mode: "serial" });

  test("admin can create a user to be deleted", async ({ adminPage }) => {
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

  test("new user can log in before deletion", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUserEmail, testUserPassword);
    await page.waitForURL("**/dashboard");
  });

  test("admin sees delete button on user row", async ({ adminPage }) => {
    const userList = new UserListPage(adminPage);
    await userList.goto();
    await userList.search(testUserName);
    await expect(userList.userRows.first()).toBeVisible({ timeout: 10000 });
    await expect(userList.userRows.first()).toContainText(testUserName);
    // Use deleteButtonForRow helper which scopes to the correct button
    await expect(userList.deleteButtonForRow(0)).toBeVisible();
  });

  test("clicking delete opens confirmation dialog with user name", async ({ adminPage }) => {
    const userList = new UserListPage(adminPage);
    const deleteDialog = new DeleteUserDialog(adminPage);

    await userList.goto();
    await userList.search(testUserName);
    await expect(userList.userRows.first()).toBeVisible({ timeout: 10000 });
    await userList.clickDeleteUser(0);

    await deleteDialog.expectOpen();
    await deleteDialog.expectUserName(testUserName);
  });

  test("cancel closes the dialog without deleting", async ({ adminPage }) => {
    const userList = new UserListPage(adminPage);
    const deleteDialog = new DeleteUserDialog(adminPage);

    await userList.goto();
    await userList.search(testUserName);
    await expect(userList.userRows.first()).toBeVisible({ timeout: 10000 });
    await userList.clickDeleteUser(0);
    await deleteDialog.expectOpen();
    await deleteDialog.clickCancel();
    await deleteDialog.expectClosed();

    // User should still be in the list
    await expect(userList.userRows.first()).toContainText(testUserName);
  });

  test("confirming delete deactivates the user", async ({ adminPage }) => {
    const userList = new UserListPage(adminPage);
    const deleteDialog = new DeleteUserDialog(adminPage);
    const toast = new ToastComponent(adminPage);

    await userList.goto();
    await userList.search(testUserName);
    await expect(userList.userRows.first()).toBeVisible({ timeout: 10000 });
    await userList.clickDeleteUser(0);
    await deleteDialog.expectOpen();
    await deleteDialog.clickDelete();
    await deleteDialog.expectClosed();
    await toast.expectToast("success", "deleted");
  });

  test("deactivated user cannot log in", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUserEmail, testUserPassword);
    await loginPage.expectErrorMessage("Invalid");
  });

  test("non-admin cannot access user management page", async ({ borrowerPage }) => {
    await borrowerPage.goto("/users");
    await expect(
      borrowerPage.getByText(/Access forbidden|not authorized/i),
    ).toBeVisible();
  });
});

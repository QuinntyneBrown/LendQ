import { test, expect } from "../../fixtures/auth.fixture";
import { UserListPage } from "../../pages/UserListPage";
import { AddEditUserDialog } from "../../pages/AddEditUserDialog";
import { DeleteUserDialog } from "../../pages/DeleteUserDialog";
import { ToastComponent } from "../../pages/ToastComponent";
import { LoginPage } from "../../pages/LoginPage";

test.describe("End-to-end: Admin user management", () => {
  test("admin creates, edits, and deactivates a user", async ({ adminPage }) => {
    const userList = new UserListPage(adminPage);
    const addDialog = new AddEditUserDialog(adminPage);
    const deleteDialog = new DeleteUserDialog(adminPage);
    const toast = new ToastComponent(adminPage);

    const uniqueEmail = `e2euser_${Date.now()}@family.com`;

    // Step 1: Create user
    await userList.goto();
    await userList.clickAddUser();
    await addDialog.fillName("E2E Test User");
    await addDialog.fillEmail(uniqueEmail);
    await addDialog.selectRoles(["Borrower"]);
    await addDialog.clickSave();
    await addDialog.expectClosed();
    await toast.expectToast("success", "created");

    // Step 2: Verify in list
    await userList.search("E2E Test User");
    await expect(userList.userRows.first()).toContainText("E2E Test User");

    // Step 3: Edit user roles
    await userList.clickEditUser(0);
    await addDialog.expectOpen();
    await addDialog.selectRoles(["Creditor"]);
    await addDialog.clickSave();
    await addDialog.expectClosed();
    await toast.expectToast("success", "updated");

    // Step 4: Deactivate user
    await userList.clickDeleteUser(0);
    await deleteDialog.expectOpen();
    await deleteDialog.clickDelete();
    await deleteDialog.expectClosed();
    await toast.expectToast("success", "deleted");
  });

  test("deactivated user cannot log in", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("deactivated@family.com", "password123");
    await loginPage.expectErrorMessage("Invalid email or password");
  });
});

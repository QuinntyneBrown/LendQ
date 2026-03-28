import { test, expect } from "../../fixtures/auth.fixture";
import { UserListPage } from "../../pages/UserListPage";
import { AddEditUserDialog } from "../../pages/AddEditUserDialog";
import { DeleteUserDialog } from "../../pages/DeleteUserDialog";
import { ToastComponent } from "../../pages/ToastComponent";
import { LoginPage } from "../../pages/LoginPage";

test.describe("End-to-end: Admin user management @smoke", () => {
  test("admin creates, edits, and deactivates a user", async ({ adminPage }) => {
    const userList = new UserListPage(adminPage);
    const addDialog = new AddEditUserDialog(adminPage);
    const deleteDialog = new DeleteUserDialog(adminPage);
    const toast = new ToastComponent(adminPage);

    const suffix = Date.now();
    const uniqueName = `E2E Test User ${suffix}`;
    const uniqueEmail = `e2euser_${suffix}@family.com`;

    // Step 1: Create user
    await userList.goto();
    await userList.clickAddUser();
    await addDialog.fillName(uniqueName);
    await addDialog.fillEmail(uniqueEmail);
    await addDialog.fillPassword("Password123!");
    await addDialog.selectRoles(["Borrower"]);
    await addDialog.clickSave();
    await addDialog.expectClosed();
    await toast.expectToast("success", "created");

    // Step 2: Verify in list
    await userList.search(uniqueName);
    await expect(userList.userRows.first()).toContainText(uniqueName);

    // Step 3: Edit user roles
    await userList.clickEditUser(0);
    await addDialog.expectOpen();
    const updatedName = `${uniqueName} Updated`;
    await addDialog.fillName(updatedName);
    await addDialog.clickSave();
    await addDialog.expectClosed();
    await toast.expectToast("success", "updated");
    await userList.search(updatedName);
    await expect(userList.userRows.first()).toContainText(updatedName);

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

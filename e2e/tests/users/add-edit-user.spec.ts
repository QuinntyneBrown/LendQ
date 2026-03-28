import { test, expect } from "../../fixtures/auth.fixture";
import { UserListPage } from "../../pages/UserListPage";
import { AddEditUserDialog } from "../../pages/AddEditUserDialog";
import { ToastComponent } from "../../pages/ToastComponent";

test.describe("L2-2.2: Add/Edit User Dialog", () => {
  let userList: UserListPage;
  let dialog: AddEditUserDialog;
  let toast: ToastComponent;

  test.beforeEach(async ({ adminPage }) => {
    userList = new UserListPage(adminPage);
    dialog = new AddEditUserDialog(adminPage);
    toast = new ToastComponent(adminPage);
    await userList.goto();
  });

  test("opens add-user modal with empty form", async () => {
    await userList.clickAddUser();
    await dialog.expectOpen();
    await dialog.expectTitle("Add New User");
  });

  test("creates user with name, email, roles, active status", async () => {
    await userList.clickAddUser();
    await dialog.fillName("New Test User");
    await dialog.fillEmail(`newuser_${Date.now()}@family.com`);
    await dialog.fillPassword("Password123!");
    await dialog.selectRoles(["Borrower"]);
    await dialog.clickSave();
    await dialog.expectClosed();
    await toast.expectToast("success", "User created");
  });

  test("shows success toast after creating user", async () => {
    await userList.clickAddUser();
    await dialog.fillName("Toast Test User");
    await dialog.fillEmail(`toast_${Date.now()}@family.com`);
    await dialog.fillPassword("Password123!");
    await dialog.selectRoles(["Borrower"]);
    await dialog.clickSave();
    await toast.expectToast("success", "created");
  });

  test("refreshes user list after creating user", async ({ adminPage }) => {
    const countBefore = await userList.userRows.count();
    await userList.clickAddUser();
    await dialog.fillName("Refresh Test User");
    await dialog.fillEmail(`refresh_${Date.now()}@family.com`);
    await dialog.fillPassword("Password123!");
    await dialog.selectRoles(["Borrower"]);
    await dialog.clickSave();
    await dialog.expectClosed();
    await expect(userList.userRows).toHaveCount(countBefore + 1);
  });

  test("opens edit-user modal pre-filled with user data", async () => {
    await userList.clickEditUser(0);
    await dialog.expectOpen();
    await dialog.expectTitle("Edit User");
    await expect(dialog.nameInput).not.toHaveValue("");
    await expect(dialog.emailInput).not.toHaveValue("");
  });

  test("updates user and shows success toast", async () => {
    await userList.clickEditUser(0);
    await dialog.fillName("Updated Name");
    await dialog.clickSave();
    await dialog.expectClosed();
    await toast.expectToast("success", "updated");
  });

  test("validates required fields (name, email, roles)", async () => {
    await userList.clickAddUser();
    await dialog.fillName("");
    await dialog.fillEmail("");
    await dialog.clickSave();
    await dialog.expectFieldError("name", "required");
    await dialog.expectFieldError("email", "required");
    await dialog.expectFieldError("role_ids", "required");
  });

  test("shows inline error for duplicate email", async () => {
    await userList.clickAddUser();
    await dialog.fillName("Duplicate User");
    await dialog.fillEmail("creditor@family.com");
    await dialog.fillPassword("Password123!");
    await dialog.selectRoles(["Borrower"]);
    await dialog.clickSave();
    await dialog.expectFieldError("email", "already exists");
  });

  test("closes modal on cancel without saving", async () => {
    await userList.clickAddUser();
    await dialog.fillName("Should Not Save");
    await dialog.clickCancel();
    await dialog.expectClosed();
  });

  test("closes modal on X button", async () => {
    await userList.clickAddUser();
    await dialog.close();
    await dialog.expectClosed();
  });

  test("shows loading/saving state on save button", async () => {
    await userList.clickAddUser();
    await dialog.fillName("Loading Test");
    await dialog.fillEmail(`loading_${Date.now()}@family.com`);
    await dialog.fillPassword("Password123!");
    await dialog.selectRoles(["Borrower"]);
    await dialog.clickSave();
    await dialog.expectSaving();
  });

  test("toggles active/inactive status", async () => {
    await userList.clickEditUser(0);
    await dialog.toggleActive();
    await dialog.clickSave();
    await dialog.expectClosed();
  });
});

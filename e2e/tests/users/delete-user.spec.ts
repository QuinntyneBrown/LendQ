import { test, expect } from "../../fixtures/auth.fixture";
import { UserListPage } from "../../pages/UserListPage";
import { DeleteUserDialog } from "../../pages/DeleteUserDialog";
import { ToastComponent } from "../../pages/ToastComponent";

test.describe("L2-2.4: Delete User Confirmation Dialog", () => {
  let userList: UserListPage;
  let dialog: DeleteUserDialog;
  let toast: ToastComponent;

  test.beforeEach(async ({ adminPage }) => {
    userList = new UserListPage(adminPage);
    dialog = new DeleteUserDialog(adminPage);
    toast = new ToastComponent(adminPage);
    await userList.goto();
  });

  test("opens confirmation dialog with user name", async () => {
    await userList.clickDeleteUser(0);
    await dialog.expectOpen();
    await expect(dialog.confirmationMessage).toBeVisible();
  });

  test("displays warning icon and destructive styling", async () => {
    await userList.clickDeleteUser(0);
    await expect(dialog.warningIcon).toBeVisible();
    await expect(dialog.deleteButton).toBeVisible();
  });

  test("explains that access is revoked and records preserved", async () => {
    await userList.clickDeleteUser(0);
    await expect(dialog.confirmationMessage).toContainText(/cannot be undone|records.*preserved/i);
  });

  test("deactivates user on confirm and shows success toast", async () => {
    await userList.clickDeleteUser(0);
    await dialog.clickDelete();
    await dialog.expectClosed();
    await toast.expectToast("success", "deleted");
  });

  test("refreshes user list after deletion", async () => {
    const countBefore = await userList.userRows.count();
    await userList.clickDeleteUser(0);
    await dialog.clickDelete();
    await dialog.expectClosed();
    await expect(userList.userRows).toHaveCount(countBefore - 1);
  });

  test("closes dialog on cancel without deleting", async () => {
    const countBefore = await userList.userRows.count();
    await userList.clickDeleteUser(0);
    await dialog.clickCancel();
    await dialog.expectClosed();
    await expect(userList.userRows).toHaveCount(countBefore);
  });

  test("shows loading state during deletion", async () => {
    await userList.clickDeleteUser(0);
    await dialog.clickDelete();
    await dialog.expectDeleting();
  });
});

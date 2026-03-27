import { test, expect } from "../../fixtures/auth.fixture";
import { ToastComponent } from "../../pages/ToastComponent";
import { UserListPage } from "../../pages/UserListPage";
import { AddEditUserDialog } from "../../pages/AddEditUserDialog";

test.describe("L2-6.2: Notification Types & Toast Messages", () => {
  test("shows success toast after creating user", async ({ adminPage }) => {
    const toast = new ToastComponent(adminPage);
    const userList = new UserListPage(adminPage);
    const dialog = new AddEditUserDialog(adminPage);
    await userList.goto();
    await userList.clickAddUser();
    await dialog.fillName("Toast Test");
    await dialog.fillEmail(`toast_${Date.now()}@family.com`);
    await dialog.selectRoles(["Borrower"]);
    await dialog.clickSave();
    await toast.expectToast("success", "created");
  });

  test("shows error toast on failed API request", async ({ creditorPage }) => {
    await creditorPage.route("**/api/v1/dashboard/summary", (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({ error: "Server error" }) }),
    );
    const toast = new ToastComponent(creditorPage);
    await creditorPage.goto("/dashboard");
    await toast.waitForToast("error");
  });

  test("toast auto-dismisses after 5 seconds", async ({ creditorPage }) => {
    const toast = new ToastComponent(creditorPage);
    await creditorPage.route("**/api/v1/dashboard/summary", (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({ error: "Server error" }) }),
    );
    await creditorPage.goto("/dashboard");
    await toast.waitForToast("error");
    await toast.expectAutoDismiss(6000);
  });

  test("toast can be manually dismissed via close button", async ({ creditorPage }) => {
    const toast = new ToastComponent(creditorPage);
    await creditorPage.route("**/api/v1/dashboard/summary", (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({ error: "Server error" }) }),
    );
    await creditorPage.goto("/dashboard");
    await toast.waitForToast("error");
    await toast.closeToast(0);
    await toast.expectNoToasts();
  });

  test("multiple toasts stack vertically", async ({ creditorPage }) => {
    const toast = new ToastComponent(creditorPage);
    await creditorPage.route("**/api/v1/dashboard/**", (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({ error: "Server error" }) }),
    );
    await creditorPage.goto("/dashboard");
    await creditorPage.waitForTimeout(2000);
    const count = await toast.allToasts().count();
    expect(count).toBeGreaterThan(1);
  });
});

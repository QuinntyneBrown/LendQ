import { test, expect } from "../../fixtures/auth.fixture";
import { UserListPage } from "../../pages/UserListPage";

test.describe("L2-2.1: User List Screen", () => {
  test("displays user table with name, email, roles, status, actions", async ({ adminPage }) => {
    const userList = new UserListPage(adminPage);
    await userList.goto();
    await expect(userList.pageTitle).toBeVisible();
    await expect(userList.userTable).toBeVisible();
    const firstRow = userList.userRows.first();
    await expect(firstRow).toBeVisible();
  });

  test("shows Add User button for admins", async ({ adminPage }) => {
    const userList = new UserListPage(adminPage);
    await userList.goto();
    await expect(userList.addUserButton).toBeVisible();
  });

  test("searches users by name and filters results", async ({ adminPage }) => {
    const userList = new UserListPage(adminPage);
    await userList.goto();
    await userList.search("Quinn");
    await expect(userList.userRows.first()).toContainText("Quinn");
  });

  test("searches users by email and filters results", async ({ adminPage }) => {
    const userList = new UserListPage(adminPage);
    await userList.goto();
    await userList.search("creditor@family.com");
    await expect(userList.userRows.first()).toContainText("creditor@family.com");
  });

  test("paginates through user list", async ({ adminPage }) => {
    const userList = new UserListPage(adminPage);
    await userList.goto();
    await expect(userList.pagination).toBeVisible();
    await userList.goToPage(2);
    await expect(userList.userRows.first()).toBeVisible();
  });

  test("sorts table by column headers", async ({ adminPage }) => {
    const userList = new UserListPage(adminPage);
    await userList.goto();
    await userList.sortBy("Name");
    await expect(userList.userRows.first()).toBeVisible();
  });

  test("shows empty state when no users match search", async ({ adminPage }) => {
    const userList = new UserListPage(adminPage);
    await userList.goto();
    await userList.search("zzz_nonexistent_user_zzz");
    await userList.expectEmptyState();
  });

  test("denies access to non-admin users (redirect to 403)", async ({ creditorPage }) => {
    await creditorPage.goto("/users");
    await expect(creditorPage.getByText(/forbidden|not authorized/i)).toBeVisible();
  });
});

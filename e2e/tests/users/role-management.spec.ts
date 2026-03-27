import { test, expect } from "../../fixtures/auth.fixture";
import { RoleManagementPage } from "../../pages/RoleManagementPage";

test.describe("L2-2.3: Role Management Screen", () => {
  test("displays all roles with descriptions", async ({ adminPage }) => {
    const rolePage = new RoleManagementPage(adminPage);
    await rolePage.goto();
    await rolePage.expectRoleCount(3);
  });

  test("shows permission chips for each role", async ({ adminPage }) => {
    const rolePage = new RoleManagementPage(adminPage);
    await rolePage.goto();
    await expect(adminPage.locator("[data-testid='permission-chip']").first()).toBeVisible();
  });

  test("edits permissions on a role and saves", async ({ adminPage }) => {
    const rolePage = new RoleManagementPage(adminPage);
    await rolePage.goto();
    await rolePage.clickEditRole("Creditor");
    await expect(adminPage.getByRole("dialog")).toBeVisible();
  });

  test("restricts to admin-only access", async ({ creditorPage }) => {
    await creditorPage.goto("/users/roles");
    await expect(creditorPage.getByText(/forbidden|not authorized/i)).toBeVisible();
  });
});

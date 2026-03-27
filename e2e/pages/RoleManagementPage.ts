import { type Locator, type Page, expect } from "@playwright/test";

export class RoleManagementPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly roleCards: Locator;
  readonly permissionChips: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByRole("heading", { name: /Role/i });
    this.roleCards = page.locator("[data-testid='role-card']");
    this.permissionChips = page.locator("[data-testid='permission-chip']");
  }

  async goto() {
    await this.page.goto("/users/roles");
  }

  async clickEditRole(roleName: string) {
    await this.page.locator(`[data-testid="role-card-${roleName.toLowerCase()}"]`).getByRole("button", { name: /edit/i }).click();
  }

  async expectRoleCount(n: number) {
    await expect(this.roleCards).toHaveCount(n);
  }

  async expectPermissions(role: string, permissions: string[]) {
    const card = this.page.locator(`[data-testid="role-card-${role.toLowerCase()}"]`);
    for (const perm of permissions) {
      await expect(card).toContainText(perm);
    }
  }
}

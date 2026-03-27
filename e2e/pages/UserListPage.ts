import { type Locator, type Page, expect } from "@playwright/test";

export class UserListPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly addUserButton: Locator;
  readonly searchInput: Locator;
  readonly userTable: Locator;
  readonly userRows: Locator;
  readonly userCards: Locator;
  readonly pagination: Locator;
  readonly sortHeaders: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByRole("heading", { name: "User Management" });
    this.addUserButton = page.getByRole("button", { name: /Add User/i });
    this.searchInput = page.getByPlaceholder(/Search users/i);
    this.userTable = page.getByRole("table");
    this.userRows = page.locator("[data-testid='user-row']");
    this.userCards = page.locator("[data-testid='user-card']");
    this.pagination = page.getByTestId("pagination");
    this.sortHeaders = page.locator("th[data-sortable]");
    this.emptyState = page.getByTestId("empty-state");
  }

  async goto() {
    await this.page.goto("/users");
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(400);
  }

  async clickAddUser() {
    await this.addUserButton.click();
  }

  async clickEditUser(index: number) {
    await this.userRows.nth(index).getByRole("button", { name: /edit/i }).click();
  }

  async clickDeleteUser(index: number) {
    await this.userRows.nth(index).getByRole("button", { name: /delete/i }).click();
  }

  async sortBy(column: string) {
    await this.page.getByRole("columnheader", { name: column }).click();
  }

  async goToPage(n: number) {
    await this.pagination.getByRole("button", { name: String(n) }).click();
  }

  editButtonForRow(index: number) {
    return this.userRows.nth(index).getByRole("button", { name: /edit/i });
  }

  deleteButtonForRow(index: number) {
    return this.userRows.nth(index).getByRole("button", { name: /delete/i });
  }

  async expectUserCount(n: number) {
    await expect(this.userRows).toHaveCount(n);
  }

  async expectUserInRow(index: number, name: string, email: string) {
    const row = this.userRows.nth(index);
    await expect(row).toContainText(name);
    await expect(row).toContainText(email);
  }

  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }

  async expectSearchResults(count: number) {
    await expect(this.userRows).toHaveCount(count);
  }
}

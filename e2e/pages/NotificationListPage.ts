import { type Locator, type Page, expect } from "@playwright/test";

export class NotificationListPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly markAllReadButton: Locator;
  readonly filterTabs: Locator;
  readonly dateGroups: Locator;
  readonly notificationItems: Locator;
  readonly pagination: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByRole("heading", { name: "Notifications" });
    this.markAllReadButton = page.getByRole("button", { name: /Mark all as read/i });
    this.filterTabs = page.locator("[data-testid='notification-filter-tab']");
    this.dateGroups = page.locator("[data-testid='date-group']");
    this.notificationItems = page.locator("[data-testid='notification-item']");
    this.pagination = page.getByTestId("pagination");
    this.emptyState = page.getByTestId("empty-state");
  }

  async goto() {
    await this.page.goto("/notifications");
  }

  async filterByType(type: string) {
    await this.filterTabs.filter({ hasText: type }).click();
  }

  async clickMarkAllRead() {
    await this.markAllReadButton.click();
  }

  async clickNotification(index: number) {
    await this.notificationItems.nth(index).click();
  }

  async goToPage(n: number) {
    await this.pagination.getByRole("button", { name: String(n) }).click();
  }

  async expectVisible() {
    await expect(this.pageTitle).toBeVisible();
  }

  async expectItemCount(n: number) {
    await expect(this.notificationItems).toHaveCount(n);
  }

  async expectDateGroup(label: string, count: number) {
    const group = this.dateGroups.filter({ hasText: label });
    await expect(group).toBeVisible();
    await expect(group.locator("[data-testid='notification-item']")).toHaveCount(count);
  }

  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }

  async expectAllRead() {
    await expect(this.page.locator("[data-testid='notification-item'][data-unread='true']")).toHaveCount(0);
  }
}

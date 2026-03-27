import { type Locator, type Page, expect } from "@playwright/test";

export class NotificationDropdown {
  readonly page: Page;
  readonly container: Locator;
  readonly headerTitle: Locator;
  readonly markAllReadLink: Locator;
  readonly notificationItems: Locator;
  readonly unreadItems: Locator;
  readonly readItems: Locator;
  readonly viewAllLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.getByTestId("notification-dropdown");
    this.headerTitle = this.container.getByText("Notifications");
    this.markAllReadLink = this.container.getByText(/Mark all read/i);
    this.notificationItems = this.container.locator("[data-testid='notification-item']");
    this.unreadItems = this.container.locator("[data-testid='notification-item'][data-unread='true']");
    this.readItems = this.container.locator("[data-testid='notification-item'][data-unread='false']");
    this.viewAllLink = this.container.getByText(/View all notifications/i);
  }

  async clickMarkAllRead() {
    await this.markAllReadLink.click();
  }

  async clickViewAll() {
    await this.viewAllLink.click();
  }

  async clickNotification(index: number) {
    await this.notificationItems.nth(index).click();
  }

  itemMessage(index: number) {
    return this.notificationItems.nth(index).locator("[data-testid='notification-message']");
  }

  async expectOpen() {
    await expect(this.container).toBeVisible();
  }

  async expectClosed() {
    await expect(this.container).toBeHidden();
  }

  async expectItemCount(n: number) {
    await expect(this.notificationItems).toHaveCount(n);
  }

  async expectUnreadCount(n: number) {
    await expect(this.unreadItems).toHaveCount(n);
  }

  async expectNotificationText(index: number, text: string) {
    await expect(this.itemMessage(index)).toContainText(text);
  }
}

import { type Locator, type Page, expect } from "@playwright/test";

export class NotificationBell {
  readonly page: Page;
  readonly bellIcon: Locator;
  readonly unreadBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.bellIcon = page.getByTestId("notification-bell");
    this.unreadBadge = page.getByTestId("unread-badge");
  }

  async click() {
    await this.bellIcon.click();
  }

  async expectBadgeCount(n: number) {
    await expect(this.unreadBadge).toContainText(String(n));
  }

  async expectNoBadge() {
    await expect(this.unreadBadge).toBeHidden({ timeout: 10000 });
  }
}

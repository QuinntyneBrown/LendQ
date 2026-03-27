import { type Locator, type Page, expect } from "@playwright/test";

export class SidebarNav {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly logo: Locator;
  readonly dashboardLink: Locator;
  readonly loansLink: Locator;
  readonly borrowingsLink: Locator;
  readonly usersLink: Locator;
  readonly notificationsLink: Locator;
  readonly settingsLink: Locator;
  readonly userAvatar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.getByTestId("desktop-sidebar");
    this.logo = this.sidebar.getByText("LendQ");
    this.dashboardLink = this.sidebar.getByRole("link", { name: /Dashboard/i });
    this.loansLink = this.sidebar.getByRole("link", { name: /My Loans/i });
    this.borrowingsLink = this.sidebar.getByRole("link", { name: /Borrowings/i });
    this.usersLink = this.sidebar.getByRole("link", { name: /Users/i });
    this.notificationsLink = this.sidebar.getByRole("link", { name: /Notifications/i });
    this.settingsLink = this.sidebar.getByRole("link", { name: /Settings/i });
    this.userAvatar = this.sidebar.getByTestId("user-avatar");
  }

  async clickNavItem(label: string) {
    await this.sidebar.getByRole("link", { name: new RegExp(label, "i") }).click();
  }

  activeItem() {
    return this.sidebar.locator("[data-active='true']");
  }

  async expectVisible() {
    await expect(this.sidebar).toBeVisible();
  }

  async expectHidden() {
    await expect(this.sidebar).toBeHidden();
  }

  async expectActiveItem(label: string) {
    await expect(this.activeItem()).toContainText(label);
  }

  async expectNavItemHidden(label: string) {
    await expect(this.sidebar.getByRole("link", { name: new RegExp(label, "i") })).toBeHidden();
  }
}

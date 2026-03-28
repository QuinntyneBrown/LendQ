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
  readonly userName: Locator;
  readonly userEmail: Locator;
  readonly signOutButton: Locator;

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
    this.userName = this.sidebar.getByTestId("sidebar-user-name");
    this.userEmail = this.sidebar.getByTestId("sidebar-user-email");
    this.signOutButton = this.sidebar.getByTestId("sidebar-sign-out");
  }

  async clickNavItem(label: string) {
    await this.navItem(label).click();
  }

  activeItem() {
    return this.sidebar.locator("[data-active='true']");
  }

  navItem(label: string) {
    return this.sidebar.getByRole("link", { name: new RegExp(label, "i") });
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

  async expectOnlyActiveItem(label: string) {
    await expect(this.activeItem()).toHaveCount(1);
    await expect(this.navItem(label)).toHaveAttribute("data-active", "true");
  }

  async expectNavItemHidden(label: string) {
    await expect(this.sidebar.getByRole("link", { name: new RegExp(label, "i") })).toBeHidden();
  }

  async expectSignOutVisible() {
    await expect(this.signOutButton).toBeVisible();
  }

  async expectUserInfo(name: string, email: string) {
    await expect(this.userName).toHaveText(name);
    await expect(this.userEmail).toHaveText(email);
  }

  async signOut() {
    await this.signOutButton.click();
  }
}

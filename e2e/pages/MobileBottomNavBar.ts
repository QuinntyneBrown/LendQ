import { type Locator, type Page, expect } from "@playwright/test";

export class MobileBottomNavBar {
  readonly page: Page;
  readonly bottomBar: Locator;
  readonly homeTab: Locator;
  readonly loansTab: Locator;
  readonly owedTab: Locator;
  readonly alertsTab: Locator;
  readonly moreTab: Locator;
  readonly moreMenu: Locator;

  constructor(page: Page) {
    this.page = page;
    this.bottomBar = page.getByTestId("mobile-bottom-nav");
    this.homeTab = this.bottomBar.getByRole("link", { name: /Home/i });
    this.loansTab = this.bottomBar.getByRole("link", { name: /Loans/i });
    this.owedTab = this.bottomBar.getByRole("link", { name: /Owed/i });
    this.alertsTab = this.bottomBar.getByRole("link", { name: /Alerts/i });
    this.moreTab = this.bottomBar.getByRole("button", { name: /More/i });
    this.moreMenu = page.getByTestId("more-menu");
  }

  async clickTab(label: string) {
    await this.bottomBar.getByRole("link", { name: new RegExp(label, "i") }).click();
  }

  async openMoreMenu() {
    await this.moreTab.click();
  }

  async clickMoreItem(label: string) {
    await this.moreMenu.getByRole("link", { name: new RegExp(label, "i") }).click();
  }

  activeTab() {
    return this.bottomBar.locator("[data-active='true']");
  }

  async expectVisible() {
    await expect(this.bottomBar).toBeVisible();
  }

  async expectActiveTab(label: string) {
    await expect(this.activeTab()).toContainText(label);
  }

  async expectMoreMenuOpen() {
    await expect(this.moreMenu).toBeVisible();
  }

  async expectMoreMenuClosed() {
    await expect(this.moreMenu).toBeHidden();
  }
}

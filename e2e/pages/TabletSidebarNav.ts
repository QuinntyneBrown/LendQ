import { type Locator, type Page, expect } from "@playwright/test";

export class TabletSidebarNav {
  readonly page: Page;
  readonly hamburgerButton: Locator;
  readonly sidebarOverlay: Locator;
  readonly backdrop: Locator;
  readonly navItems: Locator;

  constructor(page: Page) {
    this.page = page;
    this.hamburgerButton = page.getByTestId("hamburger-menu");
    this.sidebarOverlay = page.getByTestId("sidebar-overlay");
    this.backdrop = page.getByTestId("sidebar-backdrop");
    this.navItems = this.sidebarOverlay.getByRole("link");
  }

  async open() {
    await this.hamburgerButton.click();
  }

  async close() {
    await this.backdrop.click();
  }

  async clickNavItem(label: string) {
    await this.sidebarOverlay.getByRole("link", { name: new RegExp(label, "i") }).click();
  }

  activeItem() {
    return this.sidebarOverlay.locator("[data-active='true']");
  }

  async expectOpen() {
    await expect(this.sidebarOverlay).toBeVisible();
  }

  async expectClosed() {
    await expect(this.sidebarOverlay).toBeHidden();
  }

  async expectActiveItem(label: string) {
    await expect(this.activeItem()).toContainText(label);
  }
}

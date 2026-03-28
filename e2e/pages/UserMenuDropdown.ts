import { type Locator, type Page, expect } from "@playwright/test";

export class UserMenuDropdown {
  readonly page: Page;
  readonly avatarTrigger: Locator;
  readonly dropdown: Locator;
  readonly userName: Locator;
  readonly userEmail: Locator;
  readonly signOutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.avatarTrigger = page.getByTestId("user-avatar");
    this.dropdown = page.getByTestId("user-menu-dropdown");
    this.userName = this.dropdown.getByTestId("user-menu-name");
    this.userEmail = this.dropdown.getByTestId("user-menu-email");
    this.signOutButton = this.dropdown.getByRole("button", {
      name: /Sign Out/i,
    });
  }

  async open() {
    await this.avatarTrigger.click();
  }

  async signOut() {
    await this.open();
    await this.signOutButton.click();
  }

  async expectOpen() {
    await expect(this.dropdown).toBeVisible();
  }

  async expectClosed() {
    await expect(this.dropdown).toBeHidden();
  }

  async expectUserInfo(name: string, email: string) {
    await expect(this.userName).toHaveText(name);
    await expect(this.userEmail).toHaveText(email);
  }
}

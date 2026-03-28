import { type Locator, type Page, expect } from "@playwright/test";

export class ToastComponent {
  readonly page: Page;
  readonly toastContainer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.toastContainer = page.getByTestId("toast-container");
  }

  allToasts() {
    return this.toastContainer.locator("[data-testid^='toast-']");
  }

  successToasts() {
    return this.toastContainer.locator("[data-testid='toast-success']");
  }

  errorToasts() {
    return this.toastContainer.locator("[data-testid='toast-error']");
  }

  warningToasts() {
    return this.toastContainer.locator("[data-testid='toast-warning']");
  }

  infoToasts() {
    return this.toastContainer.locator("[data-testid='toast-info']");
  }

  async closeToast(index: number) {
    await this.allToasts().nth(index).getByRole("button", { name: /close/i }).click();
  }

  async waitForToast(type: string) {
    await expect(this.toastContainer.locator(`[data-testid='toast-${type}']`).first()).toBeVisible({
      timeout: 10000,
    });
  }

  async expectToast(type: string, message: string) {
    const toast = this.toastContainer.locator(`[data-testid='toast-${type}']`).first();
    await expect(toast).toBeVisible({ timeout: 10000 });
    await expect(toast).toContainText(message);
  }

  async expectToastCount(n: number) {
    await expect(this.allToasts()).toHaveCount(n);
  }

  async expectAutoDismiss(timeout = 6000) {
    const count = await this.allToasts().count();
    await this.page.waitForTimeout(timeout);
    await expect(this.allToasts()).toHaveCount(count - 1);
  }

  async expectNoToasts() {
    await expect(this.allToasts()).toHaveCount(0);
  }
}

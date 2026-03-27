import { Page, expect } from "@playwright/test";

export async function waitForToast(page: Page, type: string, text?: string) {
  const toast = page.locator(`[data-testid="toast-${type}"]`).first();
  await expect(toast).toBeVisible({ timeout: 5000 });
  if (text) {
    await expect(toast).toContainText(text);
  }
  return toast;
}

export async function waitForModalOpen(page: Page, name: string) {
  const dialog = page.getByRole("dialog", { name });
  await expect(dialog).toBeVisible({ timeout: 3000 });
  return dialog;
}

export async function waitForModalClosed(page: Page, name: string) {
  const dialog = page.getByRole("dialog", { name });
  await expect(dialog).toBeHidden({ timeout: 3000 });
}

export async function waitForNavigation(page: Page, url: string | RegExp) {
  await page.waitForURL(url, { timeout: 5000 });
}

export async function waitForLoadingComplete(page: Page) {
  await expect(page.locator("[data-testid='skeleton']").first()).toBeHidden({
    timeout: 10000,
  });
}

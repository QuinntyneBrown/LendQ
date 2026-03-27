import { test as base, type Page } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

type AuthFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
  creditorPage: Page;
  borrowerPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("creditor@family.com", "password123");
    await page.waitForURL("/dashboard");
    await use(page);
  },

  adminPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("admin@family.com", "password123");
    await page.waitForURL("/dashboard");
    await use(page);
  },

  creditorPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("creditor@family.com", "password123");
    await page.waitForURL("/dashboard");
    await use(page);
  },

  borrowerPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("borrower@family.com", "password123");
    await page.waitForURL("/dashboard");
    await use(page);
  },
});

export { expect } from "@playwright/test";

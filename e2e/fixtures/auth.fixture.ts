import { test as base, type Browser, type Page } from "@playwright/test";
import { AUTH_STORAGE_STATE } from "../helpers/auth-state";

type AuthFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
  creditorPage: Page;
  borrowerPage: Page;
};

async function createAuthenticatedPage(
  browser: Browser,
  storageState: string,
) {
  const context = await browser.newContext({ storageState });
  const page = await context.newPage();
  await page.goto("/dashboard");
  await page.waitForURL("**/dashboard");
  return { context, page };
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    const { context, page } = await createAuthenticatedPage(
      browser,
      AUTH_STORAGE_STATE.creditor,
    );
    await use(page);
    await context.close();
  },

  adminPage: async ({ browser }, use) => {
    const { context, page } = await createAuthenticatedPage(
      browser,
      AUTH_STORAGE_STATE.admin,
    );
    await use(page);
    await context.close();
  },

  creditorPage: async ({ browser }, use) => {
    const { context, page } = await createAuthenticatedPage(
      browser,
      AUTH_STORAGE_STATE.creditor,
    );
    await use(page);
    await context.close();
  },

  borrowerPage: async ({ browser }, use) => {
    const { context, page } = await createAuthenticatedPage(
      browser,
      AUTH_STORAGE_STATE.borrower,
    );
    await use(page);
    await context.close();
  },
});

export { expect } from "@playwright/test";

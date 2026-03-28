import { mkdir } from "node:fs/promises";
import { test as setup, type Page } from "@playwright/test";
import { AUTH_STATE_DIR, AUTH_STORAGE_STATE } from "../../helpers/auth-state";
import { USERS } from "../../helpers/test-users";
import { LoginPage } from "../../pages/LoginPage";

setup.describe.configure({ mode: "serial" });

async function persistRoleState(page: Page, role: keyof typeof USERS) {
  const loginPage = new LoginPage(page);
  const user = USERS[role];

  await loginPage.goto();
  await loginPage.login(user.email, user.password);
  await page.waitForURL("**/dashboard");
  await page.context().storageState({ path: AUTH_STORAGE_STATE[role] });
}

setup("create reusable auth states for test roles", async ({ browser }) => {
  await mkdir(AUTH_STATE_DIR, { recursive: true });

  for (const role of Object.keys(USERS) as Array<keyof typeof USERS>) {
    const page = await browser.newPage();
    await persistRoleState(page, role);
    await page.close();
  }
});

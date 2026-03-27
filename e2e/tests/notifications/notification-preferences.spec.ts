import { test, expect } from "../../fixtures/auth.fixture";

test.describe("L2-6.5: Notification Preferences", () => {
  test("displays email preference toggles by category", async ({ creditorPage }) => {
    await creditorPage.goto("/settings");
    await expect(creditorPage.getByTestId("notification-preferences")).toBeVisible();
    await expect(creditorPage.getByLabel(/Payment Due/i)).toBeVisible();
    await expect(creditorPage.getByLabel(/Payment Overdue/i)).toBeVisible();
  });

  test("toggles email on/off for a notification type", async ({ creditorPage }) => {
    await creditorPage.goto("/settings");
    const toggle = creditorPage.getByLabel(/Payment Due/i);
    await toggle.click();
    await expect(toggle).not.toBeChecked();
    await toggle.click();
    await expect(toggle).toBeChecked();
  });

  test("preference changes take effect immediately", async ({ creditorPage }) => {
    await creditorPage.goto("/settings");
    const toggle = creditorPage.getByLabel(/Payment Due/i);
    await toggle.click();
    await creditorPage.reload();
    await expect(toggle).not.toBeChecked();
  });

  test("in-app notifications remain regardless of email setting", async ({ creditorPage }) => {
    await creditorPage.goto("/settings");
    const toggle = creditorPage.getByLabel(/Payment Due/i);
    await toggle.uncheck();
    await creditorPage.goto("/notifications");
    await expect(creditorPage.locator("[data-testid='notification-item']").first()).toBeVisible();
  });
});

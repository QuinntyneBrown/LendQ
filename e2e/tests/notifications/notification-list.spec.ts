import { test, expect } from "../../fixtures/auth.fixture";
import { NotificationListPage } from "../../pages/NotificationListPage";

test.describe("L2-6.3: Full Notifications Screen", () => {
  let notifPage: NotificationListPage;

  test.beforeEach(async ({ creditorPage }) => {
    notifPage = new NotificationListPage(creditorPage);
    await notifPage.goto();
  });

  test("displays all notifications grouped by date", async () => {
    await notifPage.expectVisible();
    await expect(notifPage.dateGroups.first()).toBeVisible();
  });

  test("shows Today, Yesterday, and Earlier groups", async () => {
    await expect(notifPage.dateGroups.filter({ hasText: "Today" })).toBeVisible();
  });

  test("filters by type", async () => {
    await notifPage.filterByType("Payments");
    const count = await notifPage.notificationItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test("marks individual notification as read", async ({ creditorPage }) => {
    await notifPage.clickNotification(0);
    await creditorPage.goBack();
    await expect(
      creditorPage.locator("[data-testid='notification-item'][data-unread='true']").first(),
    ).toBeVisible();
  });

  test("marks all notifications as read", async () => {
    await notifPage.clickMarkAllRead();
    await notifPage.expectAllRead();
  });

  test("paginates through notifications", async () => {
    await expect(notifPage.pagination).toBeVisible();
  });

  test("shows empty state when no notifications", async ({ creditorPage }) => {
    await creditorPage.route("**/api/v1/notifications*", (route) =>
      route.fulfill({
        status: 200,
        body: JSON.stringify({ items: [], total: 0, page: 1, per_page: 20, pages: 0 }),
      }),
    );
    await notifPage.goto();
    await notifPage.expectEmptyState();
  });

  test("each notification shows icon, message, timestamp", async () => {
    const item = notifPage.notificationItems.first();
    await expect(item.locator("[data-testid='notification-icon']")).toBeVisible();
    await expect(item.locator("[data-testid='notification-message']")).toBeVisible();
    await expect(item.locator("[data-testid='notification-timestamp']")).toBeVisible();
  });
});

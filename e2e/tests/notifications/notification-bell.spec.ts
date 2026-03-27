import { test, expect } from "../../fixtures/auth.fixture";
import { NotificationBell } from "../../pages/NotificationBell";
import { NotificationDropdown } from "../../pages/NotificationDropdown";

test.describe("L2-6.1: Notification Bell & Dropdown", () => {
  let bell: NotificationBell;
  let dropdown: NotificationDropdown;

  test.beforeEach(async ({ creditorPage }) => {
    bell = new NotificationBell(creditorPage);
    dropdown = new NotificationDropdown(creditorPage);
    await creditorPage.goto("/dashboard");
  });

  test("displays bell icon in header", async () => {
    await expect(bell.bellIcon).toBeVisible();
  });

  test("shows unread count badge when notifications exist", async () => {
    await bell.expectBadgeCount(5);
  });

  test("hides badge when all notifications are read", async ({ creditorPage }) => {
    await creditorPage.route("**/api/v1/notifications/count", (route) =>
      route.fulfill({ status: 200, body: JSON.stringify({ unread_count: 0 }) }),
    );
    await creditorPage.reload();
    await bell.expectNoBadge();
  });

  test("opens dropdown on bell click", async () => {
    await bell.click();
    await dropdown.expectOpen();
  });

  test("dropdown shows recent notifications", async () => {
    await bell.click();
    const count = await dropdown.notificationItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test("unread notifications have distinct background", async () => {
    await bell.click();
    const unreadCount = await dropdown.unreadItems.count();
    expect(unreadCount).toBeGreaterThan(0);
  });

  test("read notifications have normal background", async () => {
    await bell.click();
    await expect(dropdown.readItems.first()).toBeVisible();
  });

  test("clicking Mark all as read clears badge", async () => {
    await bell.click();
    await dropdown.clickMarkAllRead();
    await bell.expectNoBadge();
  });

  test("clicking a notification navigates to related loan", async ({ creditorPage }) => {
    await bell.click();
    await dropdown.clickNotification(0);
    await creditorPage.waitForURL(/\/loans\/[a-z0-9-]+/);
  });

  test("clicking View all navigates to full notifications page", async ({ creditorPage }) => {
    await bell.click();
    await dropdown.clickViewAll();
    await creditorPage.waitForURL("/notifications");
  });

  test("dropdown closes on outside click", async ({ creditorPage }) => {
    await bell.click();
    await dropdown.expectOpen();
    await creditorPage.locator("body").click({ position: { x: 10, y: 10 } });
    await dropdown.expectClosed();
  });
});

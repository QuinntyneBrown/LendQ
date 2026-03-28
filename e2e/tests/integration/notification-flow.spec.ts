import { test, expect } from "../../fixtures/auth.fixture";
import { NotificationBell } from "../../pages/NotificationBell";
import { NotificationDropdown } from "../../pages/NotificationDropdown";
import { ToastComponent } from "../../pages/ToastComponent";

test.describe("End-to-end: Notification lifecycle @smoke", () => {
  test("notifications appear and can be managed", async ({ creditorPage }) => {
    const bell = new NotificationBell(creditorPage);
    const dropdown = new NotificationDropdown(creditorPage);

    // Step 1: Check bell shows unread count
    await creditorPage.goto("/dashboard");
    await expect(bell.bellIcon).toBeVisible();
    await expect(bell.unreadBadge).toBeVisible();

    // Step 2: Open dropdown and see notifications
    await bell.click();
    await dropdown.expectOpen();
    const count = await dropdown.notificationItems.count();
    expect(count).toBeGreaterThan(0);

    // Step 3: Click a notification to navigate
    await dropdown.clickNotification(0);
    await creditorPage.waitForURL(/\/loans\/[a-z0-9-]+/);

    // Step 4: Go back and mark all as read
    await creditorPage.goto("/dashboard");
    await bell.click();
    await dropdown.clickMarkAllRead();
    await bell.expectNoBadge();

    // Step 5: View all navigates to full page
    await bell.click();
    await dropdown.clickViewAll();
    await creditorPage.waitForURL("/notifications");
  });

  test("toast appears for real-time events", async ({ creditorPage }) => {
    const toast = new ToastComponent(creditorPage);
    await creditorPage.goto("/dashboard");

    // Simulate a server-sent event or a mutation that triggers a toast
    await creditorPage.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("lendq:notification", {
          detail: { type: "success", message: "Payment received" },
        }),
      );
    });
    await toast.expectToast("success", "Payment received");
  });
});

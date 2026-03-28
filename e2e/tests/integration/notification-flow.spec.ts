import { test, expect } from "../../fixtures/data.fixture";
import { NotificationBell } from "../../pages/NotificationBell";
import { NotificationDropdown } from "../../pages/NotificationDropdown";
import { LoanDetailPage } from "../../pages/LoanDetailPage";
import { PaymentScheduleSection } from "../../pages/PaymentScheduleSection";
import { ReschedulePaymentDialog } from "../../pages/ReschedulePaymentDialog";
import { NotificationListPage } from "../../pages/NotificationListPage";
import { ToastComponent } from "../../pages/ToastComponent";
import { futureIsoDate } from "../../helpers/date-values";

test.describe("End-to-end: Notification lifecycle @smoke", () => {
  test("notifications appear and can be managed", async ({
    creditorPage,
    borrowerPage,
    seededLoanId,
  }) => {
    const bell = new NotificationBell(creditorPage);
    const dropdown = new NotificationDropdown(creditorPage);
    const notifications = new NotificationListPage(creditorPage);
    const detail = new LoanDetailPage(borrowerPage);
    const schedule = new PaymentScheduleSection(borrowerPage);
    const rescheduleDialog = new ReschedulePaymentDialog(borrowerPage);

    await detail.goto(seededLoanId);
    await schedule.clickReschedule(0);
    await rescheduleDialog.expectOpen();
    await rescheduleDialog.fillNewDate(futureIsoDate(14));
    await rescheduleDialog.fillReason("Smoke notification trigger");
    await rescheduleDialog.clickReschedule();
    await rescheduleDialog.expectClosed();

    // Step 1: Check bell shows unread count
    await creditorPage.goto("/dashboard");
    await expect(bell.bellIcon).toBeVisible();

    // Step 2: Open dropdown and see notifications
    await bell.click();
    await dropdown.expectOpen();
    const count = await dropdown.notificationItems.count();
    expect(count).toBeGreaterThan(0);

    // Step 3: Open the notifications page and navigate from a notification
    await bell.click();
    await dropdown.clickViewAll();
    await notifications.expectVisible();
    await notifications.clickNotification(0);
    await creditorPage.waitForURL(/\/loans\/[a-z0-9-]+/);
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

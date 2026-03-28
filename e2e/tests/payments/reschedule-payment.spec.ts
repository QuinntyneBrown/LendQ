import { test, expect } from "../../fixtures/data.fixture";
import { LoanDetailPage } from "../../pages/LoanDetailPage";
import { PaymentScheduleSection } from "../../pages/PaymentScheduleSection";
import { ReschedulePaymentDialog } from "../../pages/ReschedulePaymentDialog";
import { ToastComponent } from "../../pages/ToastComponent";

test.describe("L2-4.2: Reschedule Payment Dialog", () => {
  let detail: LoanDetailPage;
  let schedule: PaymentScheduleSection;
  let dialog: ReschedulePaymentDialog;
  let toast: ToastComponent;

  test.beforeEach(async ({ creditorPage, seededLoanId }) => {
    detail = new LoanDetailPage(creditorPage);
    schedule = new PaymentScheduleSection(creditorPage);
    dialog = new ReschedulePaymentDialog(creditorPage);
    toast = new ToastComponent(creditorPage);
    await detail.goto(seededLoanId);
  });

  test("opens reschedule dialog from schedule row", async () => {
    await schedule.clickReschedule(0);
    await dialog.expectOpen();
  });

  test("displays current payment date and amount", async () => {
    await schedule.clickReschedule(0);
    await expect(dialog.currentPaymentInfo).toBeVisible();
  });

  test("selects a new date", async () => {
    await schedule.clickReschedule(0);
    await dialog.fillNewDate("2025-05-15");
    await expect(dialog.newDateInput).toHaveValue("2025-05-15");
  });

  test("enters optional reason", async () => {
    await schedule.clickReschedule(0);
    await dialog.fillReason("Need more time");
    await expect(dialog.reasonTextarea).toHaveValue("Need more time");
  });

  test("reschedules payment and shows success toast", async () => {
    await schedule.clickReschedule(0);
    await dialog.fillNewDate("2025-05-15");
    await dialog.clickReschedule();
    await dialog.expectClosed();
    await toast.expectToast("success", "rescheduled");
  });

  test("shows original date with strikethrough after reschedule", async () => {
    await schedule.clickReschedule(0);
    await dialog.fillNewDate("2025-05-15");
    await dialog.clickReschedule();
    await dialog.expectClosed();
    await expect(schedule.originalDate(0)).toBeVisible();
  });

  test("updates payment status to Rescheduled", async () => {
    await schedule.clickReschedule(0);
    await dialog.fillNewDate("2025-05-15");
    await dialog.clickReschedule();
    await schedule.expectPaymentStatus(0, "Rescheduled");
  });

  test("validates new date is in the future", async () => {
    await schedule.clickReschedule(0);
    await dialog.fillNewDate("2020-01-01");
    await dialog.clickReschedule();
    await dialog.expectFieldError("new_date", "future");
  });

  test("closes dialog on cancel", async () => {
    await schedule.clickReschedule(0);
    await dialog.clickCancel();
    await dialog.expectClosed();
  });
});

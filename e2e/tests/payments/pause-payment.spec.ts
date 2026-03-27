import { test, expect } from "../../fixtures/auth.fixture";
import { LoanDetailPage } from "../../pages/LoanDetailPage";
import { PaymentScheduleSection } from "../../pages/PaymentScheduleSection";
import { PausePaymentDialog } from "../../pages/PausePaymentDialog";
import { ToastComponent } from "../../pages/ToastComponent";

test.describe("L2-4.3: Pause Payment Dialog", () => {
  let detail: LoanDetailPage;
  let schedule: PaymentScheduleSection;
  let dialog: PausePaymentDialog;
  let toast: ToastComponent;

  test.beforeEach(async ({ creditorPage }) => {
    detail = new LoanDetailPage(creditorPage);
    schedule = new PaymentScheduleSection(creditorPage);
    dialog = new PausePaymentDialog(creditorPage);
    toast = new ToastComponent(creditorPage);
    await detail.goto("test-loan-id");
  });

  test("opens pause dialog from schedule row", async () => {
    await schedule.clickPause(0);
    await dialog.expectOpen();
  });

  test("displays warning about pause behavior", async () => {
    await schedule.clickPause(0);
    await dialog.expectWarningVisible();
  });

  test("displays payment details being paused", async () => {
    await schedule.clickPause(0);
    await expect(dialog.paymentInfo).toBeVisible();
  });

  test("pauses payment with optional reason", async () => {
    await schedule.clickPause(0);
    await dialog.fillReason("Temporary financial difficulty");
    await dialog.clickPause();
    await dialog.expectClosed();
    await toast.expectToast("success", "paused");
  });

  test("shows success toast after pausing", async () => {
    await schedule.clickPause(0);
    await dialog.clickPause();
    await toast.expectToast("success", "paused");
  });

  test("updates payment status to Paused in schedule", async () => {
    await schedule.clickPause(0);
    await dialog.clickPause();
    await dialog.expectClosed();
    await schedule.expectPaymentStatus(0, "Paused");
  });

  test("can resume a paused payment", async () => {
    await schedule.clickResume(2);
    await schedule.expectPaymentStatus(2, "Scheduled");
  });

  test("closes dialog on cancel", async () => {
    await schedule.clickPause(0);
    await dialog.clickCancel();
    await dialog.expectClosed();
  });
});

import { test, expect } from "../../fixtures/data.fixture";
import { LoanDetailPage } from "../../pages/LoanDetailPage";
import { PaymentScheduleSection } from "../../pages/PaymentScheduleSection";
import { PausePaymentDialog } from "../../pages/PausePaymentDialog";

test.describe("L2-4.3: Pause Payment Dialog", () => {
  let detail: LoanDetailPage;
  let schedule: PaymentScheduleSection;
  let dialog: PausePaymentDialog;

  test.beforeEach(async ({ creditorPage, seededLoanId }) => {
    detail = new LoanDetailPage(creditorPage);
    schedule = new PaymentScheduleSection(creditorPage);
    dialog = new PausePaymentDialog(creditorPage);
    await detail.goto(seededLoanId);
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
    await schedule.expectPaymentStatus(0, "Paused");
  });

  test("updates payment status to Paused in schedule", async () => {
    await schedule.clickPause(0);
    await dialog.clickPause();
    await dialog.expectClosed();
    await schedule.expectPaymentStatus(0, "Paused");
  });
  test("closes dialog on cancel", async () => {
    await schedule.clickPause(0);
    await dialog.clickCancel();
    await dialog.expectClosed();
  });
});

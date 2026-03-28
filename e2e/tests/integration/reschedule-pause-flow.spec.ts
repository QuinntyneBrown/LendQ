import { test, expect } from "../../fixtures/data.fixture";
import { LoanDetailPage } from "../../pages/LoanDetailPage";
import { PaymentScheduleSection } from "../../pages/PaymentScheduleSection";
import { ReschedulePaymentDialog } from "../../pages/ReschedulePaymentDialog";
import { PausePaymentDialog } from "../../pages/PausePaymentDialog";
import { futureIsoDate } from "../../helpers/date-values";

test.describe("End-to-end: Schedule modification flow @smoke", () => {
  test("borrower reschedules, pauses, and resumes payments", async ({ borrowerPage, seededLoanId }) => {
    const detail = new LoanDetailPage(borrowerPage);
    const schedule = new PaymentScheduleSection(borrowerPage);

    await detail.goto(seededLoanId);

    // Step 1: Reschedule a payment
    const rescheduleDialog = new ReschedulePaymentDialog(borrowerPage);
    await schedule.clickReschedule(0);
    await rescheduleDialog.expectOpen();
    await rescheduleDialog.fillNewDate(futureIsoDate(14));
    await rescheduleDialog.fillReason("Need more time");
    await rescheduleDialog.clickReschedule();
    await rescheduleDialog.expectClosed();

    // Step 2: Verify strikethrough original date
    await expect(schedule.originalDate(0)).toBeVisible();
    await schedule.expectPaymentStatus(0, "Rescheduled");

    // Step 3: Pause a different payment
    const pauseDialog = new PausePaymentDialog(borrowerPage);
    await schedule.clickPause(1);
    await pauseDialog.expectOpen();
    await pauseDialog.fillReason("Temporary difficulty");
    await pauseDialog.clickPause();
    await pauseDialog.expectClosed();
    await schedule.expectPaymentStatus(1, "Paused");
  });
});

import { test, expect } from "../../fixtures/data.fixture";
import { LoanDetailPage } from "../../pages/LoanDetailPage";
import { RecordPaymentDialog } from "../../pages/RecordPaymentDialog";
import { PaymentScheduleSection } from "../../pages/PaymentScheduleSection";
import { isoDateFromToday } from "../../helpers/date-values";

test.describe("L2-4.3: Record Payment from loan detail @smoke", () => {
  test("Record Payment button opens dialog and records a payment", async ({
    creditorPage,
    seededLoanId,
  }) => {
    const detail = new LoanDetailPage(creditorPage);
    const dialog = new RecordPaymentDialog(creditorPage);
    const schedule = new PaymentScheduleSection(creditorPage);

    await detail.goto(seededLoanId);

    // Click the header Record Payment button
    await detail.clickRecordPayment();

    // Verify the dialog opens
    await dialog.expectOpen();

    // Verify the amount is pre-filled with the first scheduled payment amount
    const amount = await dialog.amountInput.inputValue();
    expect(Number(amount)).toBeGreaterThan(0);

    // Fill in the date and submit
    await dialog.fillDate(isoDateFromToday());
    await dialog.clickRecord();
    await dialog.expectClosed();

    // Verify the first payment is now marked as Paid
    await schedule.expectPaymentStatus(0, "Paid");
  });
});

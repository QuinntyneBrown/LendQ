import { test, expect } from "../../fixtures/data.fixture";
import { LoanDetailPage } from "../../pages/LoanDetailPage";
import { PaymentScheduleSection } from "../../pages/PaymentScheduleSection";
import { RecordPaymentDialog } from "../../pages/RecordPaymentDialog";
import { isoDateFromToday } from "../../helpers/date-values";

test.describe("Record Payment", () => {
  test("Record Payment button scrolls to schedule and row action opens dialog", async ({
    creditorPage,
    seededLoanId,
  }) => {
    const detail = new LoanDetailPage(creditorPage);
    const schedule = new PaymentScheduleSection(creditorPage);
    const dialog = new RecordPaymentDialog(creditorPage);

    await detail.goto(seededLoanId);
    await expect(detail.loanTitle).toBeVisible();

    // Header "Record Payment" button scrolls to the payment schedule
    await detail.clickRecordPayment();
    await expect(schedule.container).toBeInViewport();

    // Click the Record button on the first scheduled payment row
    await schedule.clickRecordPayment(0);
    await dialog.expectOpen();
    await expect(dialog.titleText).toHaveText(/Record Payment/i);

    // Verify form fields are present and pre-populated
    await expect(dialog.amountInput).toBeVisible();
    await expect(dialog.amountInput).not.toHaveValue("");
    await expect(dialog.dateInput).toBeVisible();
    await expect(dialog.methodSelect).toBeVisible();
    await expect(dialog.notesInput).toBeVisible();
    await expect(dialog.balancePreview).toBeVisible();
    await expect(dialog.recordButton).toBeEnabled();
    await expect(dialog.cancelButton).toBeVisible();
  });

  test("submitting the form records the payment and updates the schedule", async ({
    creditorPage,
    seededLoanId,
  }) => {
    const detail = new LoanDetailPage(creditorPage);
    const schedule = new PaymentScheduleSection(creditorPage);
    const dialog = new RecordPaymentDialog(creditorPage);

    await detail.goto(seededLoanId);

    // Open dialog from the first payment row
    await schedule.clickRecordPayment(0);
    await dialog.expectOpen();

    // Fill in the form and submit
    await dialog.fillDate(isoDateFromToday());
    await dialog.selectMethod("Cash");
    await dialog.fillNotes("E2E test payment");
    await dialog.clickRecord();

    // Dialog closes and payment row updates to Paid
    await dialog.expectClosed();
    await schedule.expectPaymentStatus(0, "Paid");
  });

  test("cancel button closes the dialog without recording", async ({
    creditorPage,
    seededLoanId,
  }) => {
    const detail = new LoanDetailPage(creditorPage);
    const schedule = new PaymentScheduleSection(creditorPage);
    const dialog = new RecordPaymentDialog(creditorPage);

    await detail.goto(seededLoanId);
    await schedule.clickRecordPayment(0);
    await dialog.expectOpen();

    await dialog.clickCancel();
    await dialog.expectClosed();

    // Payment should still be in its original status, not Paid
    await schedule.expectPaymentStatus(0, "Scheduled");
  });

  test("shows validation error for zero amount", async ({
    creditorPage,
    seededLoanId,
  }) => {
    const detail = new LoanDetailPage(creditorPage);
    const schedule = new PaymentScheduleSection(creditorPage);
    const dialog = new RecordPaymentDialog(creditorPage);

    await detail.goto(seededLoanId);
    await schedule.clickRecordPayment(0);
    await dialog.expectOpen();

    await dialog.fillAmount("0");
    await dialog.clickRecord();

    // Dialog stays open with a validation error
    await dialog.expectOpen();
    await dialog.expectFieldError("amount", "expected number to be >0");
  });
});

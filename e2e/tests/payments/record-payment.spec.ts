import { test, expect } from "../../fixtures/data.fixture";
import { LoanDetailPage } from "../../pages/LoanDetailPage";
import { PaymentScheduleSection } from "../../pages/PaymentScheduleSection";
import { RecordPaymentDialog } from "../../pages/RecordPaymentDialog";
import { ToastComponent } from "../../pages/ToastComponent";

test.describe("L2-4.4: Record Payment / Lump Sum Dialog", () => {
  let detail: LoanDetailPage;
  let schedule: PaymentScheduleSection;
  let dialog: RecordPaymentDialog;
  let toast: ToastComponent;

  test.beforeEach(async ({ creditorPage, seededLoanId }) => {
    detail = new LoanDetailPage(creditorPage);
    schedule = new PaymentScheduleSection(creditorPage);
    dialog = new RecordPaymentDialog(creditorPage);
    toast = new ToastComponent(creditorPage);
    await detail.goto(seededLoanId);
  });

  test("opens record-payment dialog from schedule row", async () => {
    await schedule.clickRecordPayment(0);
    await dialog.expectOpen();
  });

  test("pre-fills amount from scheduled payment", async () => {
    await schedule.clickRecordPayment(0);
    await dialog.expectPrefilledAmount("200");
  });

  test("shows scheduled payment info", async () => {
    await schedule.clickRecordPayment(0);
    await expect(dialog.scheduledInfo).toBeVisible();
  });

  test("calculates and displays live balance preview", async () => {
    await schedule.clickRecordPayment(0);
    await dialog.fillAmount("200");
    await dialog.expectBalancePreview("$3,800");
  });

  test("records exact scheduled amount", async () => {
    await schedule.clickRecordPayment(0);
    await dialog.fillDate("2025-04-01");
    await dialog.clickRecord();
    await dialog.expectClosed();
    await toast.expectToast("success", "Payment recorded");
  });

  test("records partial payment", async () => {
    await schedule.clickRecordPayment(0);
    await dialog.fillAmount("100");
    await dialog.fillDate("2025-04-01");
    await dialog.clickRecord();
    await dialog.expectClosed();
    await toast.expectToast("success", "recorded");
  });

  test("records lump-sum payment", async () => {
    await schedule.clickRecordPayment(0);
    await dialog.fillAmount("1000");
    await dialog.fillDate("2025-04-01");
    await dialog.clickRecord();
    await dialog.expectClosed();
    await toast.expectToast("success", "recorded");
  });

  test("shows lump-sum allocation note", async () => {
    await schedule.clickRecordPayment(0);
    await dialog.fillAmount("1000");
    await expect(dialog.dialog.getByText(/excess.*applied/i)).toBeVisible();
  });

  test("updates loan status to Paid Off when balance reaches zero", async () => {
    await schedule.clickRecordPayment(0);
    await dialog.fillAmount("5000");
    await dialog.fillDate("2025-04-01");
    await dialog.clickRecord();
    await expect(detail.statusBadge).toContainText("Paid Off");
  });

  test("shows success toast after recording", async () => {
    await schedule.clickRecordPayment(0);
    await dialog.fillDate("2025-04-01");
    await dialog.clickRecord();
    await toast.expectToast("success", "recorded");
  });

  test("refreshes schedule and loan detail after recording", async () => {
    await schedule.clickRecordPayment(0);
    await dialog.fillDate("2025-04-01");
    await dialog.clickRecord();
    await dialog.expectClosed();
    await schedule.expectPaymentStatus(0, "Paid");
  });

  test("validates amount is positive", async () => {
    await schedule.clickRecordPayment(0);
    await dialog.fillAmount("0");
    await dialog.clickRecord();
    await dialog.expectFieldError("amount", "positive");
  });

  test("validates date is required", async () => {
    await schedule.clickRecordPayment(0);
    await dialog.dateInput.clear();
    await dialog.clickRecord();
    await dialog.expectFieldError("date", "required");
  });

  test("prevents duplicate submission", async () => {
    await schedule.clickRecordPayment(0);
    await dialog.fillDate("2025-04-01");
    await dialog.clickRecord();
    await dialog.expectRecording();
  });

  test("closes dialog on cancel", async () => {
    await schedule.clickRecordPayment(0);
    await dialog.clickCancel();
    await dialog.expectClosed();
  });
});

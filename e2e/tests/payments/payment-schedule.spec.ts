import { test, expect } from "../../fixtures/data.fixture";
import { LoanDetailPage } from "../../pages/LoanDetailPage";
import { PaymentScheduleSection } from "../../pages/PaymentScheduleSection";

test.describe("L2-4.1: Payment Schedule View", () => {
  let detail: LoanDetailPage;
  let schedule: PaymentScheduleSection;

  test.beforeEach(async ({ creditorPage, seededLoanId }) => {
    detail = new LoanDetailPage(creditorPage);
    schedule = new PaymentScheduleSection(creditorPage);
    await detail.goto(seededLoanId);
  });

  test("displays all scheduled payments with date, amount, status", async () => {
    await schedule.expectPaymentCount(12);
  });

  test("shows correct status badges", async () => {
    await expect(schedule.statusBadge(0)).toBeVisible();
  });

  test("shows original date with strikethrough for rescheduled payments", async () => {
    await schedule.expectOriginalDateStrikethrough(0, "2025-03-01");
  });

  test("shows paused payments as visually distinct", async () => {
    await schedule.expectPaymentStatus(2, "Paused");
  });

  test("shows partial payments as distinct from fully paid", async () => {
    await schedule.expectPaymentStatus(0, "Partial");
  });

  test("shows contextual action buttons per payment status", async () => {
    await schedule.expectActionsForStatus(0, "Scheduled");
  });

  test("hides reschedule/pause on already paid payments", async () => {
    await schedule.expectActionsForStatus(0, "Paid");
  });
});

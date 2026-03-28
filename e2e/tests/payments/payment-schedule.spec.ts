import { test, expect } from "../../fixtures/data.fixture";
import { LoanDetailPage } from "../../pages/LoanDetailPage";
import { PaymentScheduleSection } from "../../pages/PaymentScheduleSection";

test.describe("L2-4.1: Payment Schedule View", () => {
  let detail: LoanDetailPage;
  let schedule: PaymentScheduleSection;

  test("displays all scheduled payments with date, amount, status", async ({ creditorPage, loanDetailScenario }) => {
    detail = new LoanDetailPage(creditorPage);
    schedule = new PaymentScheduleSection(creditorPage);
    await detail.goto(loanDetailScenario.loanId);
    await schedule.expectPaymentCount(12);
  });

  test("shows correct status badges", async ({ creditorPage, loanDetailScenario }) => {
    detail = new LoanDetailPage(creditorPage);
    schedule = new PaymentScheduleSection(creditorPage);
    await detail.goto(loanDetailScenario.loanId);
    await expect(schedule.statusBadge(0)).toBeVisible();
  });

  test("shows original date with strikethrough for rescheduled payments", async ({ creditorPage, rescheduledLoanScenario }) => {
    detail = new LoanDetailPage(creditorPage);
    schedule = new PaymentScheduleSection(creditorPage);
    await detail.goto(rescheduledLoanScenario.loanId);
    await schedule.expectOriginalDateStrikethrough(0, rescheduledLoanScenario.originalDueDateLabel!);
  });

  test("shows paused payments as visually distinct", async ({ creditorPage, pausedLoanScenario }) => {
    detail = new LoanDetailPage(creditorPage);
    schedule = new PaymentScheduleSection(creditorPage);
    await detail.goto(pausedLoanScenario.loanId);
    await schedule.expectPaymentStatus(0, "Paused");
  });

  test("shows partial payments as distinct from fully paid", async ({ creditorPage, partialPaymentLoanScenario }) => {
    detail = new LoanDetailPage(creditorPage);
    schedule = new PaymentScheduleSection(creditorPage);
    await detail.goto(partialPaymentLoanScenario.loanId);
    await schedule.expectPaymentStatus(0, "Partial");
  });

  test("shows contextual action buttons per payment status", async ({ creditorPage, loanDetailScenario }) => {
    detail = new LoanDetailPage(creditorPage);
    schedule = new PaymentScheduleSection(creditorPage);
    await detail.goto(loanDetailScenario.loanId);
    await schedule.expectActionsForStatus(0, "Scheduled");
  });

  test("hides reschedule/pause on already paid payments", async ({ creditorPage, paidOffLoanScenario }) => {
    detail = new LoanDetailPage(creditorPage);
    schedule = new PaymentScheduleSection(creditorPage);
    await detail.goto(paidOffLoanScenario.loanId);
    await schedule.expectActionsForStatus(0, "Paid");
  });
});

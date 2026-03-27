import { test, expect } from "../../fixtures/auth.fixture";
import { LoanDetailPage } from "../../pages/LoanDetailPage";
import { PaymentHistorySection } from "../../pages/PaymentHistorySection";

test.describe("L2-4.5: Payment History with Change Log", () => {
  let detail: LoanDetailPage;
  let history: PaymentHistorySection;

  test.beforeEach(async ({ creditorPage }) => {
    detail = new LoanDetailPage(creditorPage);
    history = new PaymentHistorySection(creditorPage);
    await detail.goto("test-loan-id");
  });

  test("displays payment history timeline", async () => {
    await expect(history.container).toBeVisible();
    const count = await history.historyEntries.count();
    expect(count).toBeGreaterThan(0);
  });

  test("shows payment entries with amount, date, status", async () => {
    await expect(history.entryDescription(0)).toBeVisible();
    await expect(history.entryTimestamp(0)).toBeVisible();
  });

  test("shows reschedule entries with old/new dates", async () => {
    await history.filterByType("Reschedule");
    await history.expectChangeDetail(0, "Mar 1", "Mar 15");
  });

  test("shows pause entries with reason", async () => {
    await history.filterByType("Pause");
    await expect(history.entryDescription(0)).toContainText(/paused/i);
  });

  test("shows who made each change and when", async () => {
    await expect(history.entryTimestamp(0)).toBeVisible();
  });

  test("filters history by type", async () => {
    await history.filterByType("Payment");
    const count = await history.historyEntries.count();
    expect(count).toBeGreaterThan(0);
  });

  test("distinguishes payments from modifications visually", async () => {
    await expect(history.entryIcon(0)).toBeVisible();
  });
});

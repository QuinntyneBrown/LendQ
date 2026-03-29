import { test, expect } from "../../fixtures/data.fixture";
import { LoanDetailPage } from "../../pages/LoanDetailPage";
import { VIEWPORTS } from "../../fixtures/viewport.fixture";

test.describe("Loan Detail — mobile responsive @responsive", () => {
  test('mobile: Record Payment button should display "Record" not "Record Payment"', async ({
    creditorPage,
    loanDetailScenario,
  }) => {
    await creditorPage.setViewportSize(VIEWPORTS.mobile);
    const detail = new LoanDetailPage(creditorPage);
    await detail.goto(loanDetailScenario.loanId);

    // On mobile the button text should be shortened to "Record"
    await expect(detail.recordButton).toBeVisible();
    // The full "Record Payment" text should NOT be present on mobile
    await expect(detail.recordPaymentButton).toBeHidden();
  });

  test("mobile: loan description is fully visible next to status badge", async ({
    creditorPage,
    loanDetailScenario,
  }) => {
    await creditorPage.setViewportSize(VIEWPORTS.mobile);
    const detail = new LoanDetailPage(creditorPage);
    await detail.goto(loanDetailScenario.loanId);

    // The loan title (description) must be visible and not obscured
    await expect(detail.loanTitle).toBeVisible();
    await expect(detail.statusBadge).toBeVisible();

    // Both should be in the viewport and near each other (same row)
    const titleBox = await detail.loanTitle.boundingBox();
    const badgeBox = await detail.statusBadge.boundingBox();
    expect(titleBox).not.toBeNull();
    expect(badgeBox).not.toBeNull();
    expect(Math.abs(titleBox!.y - badgeBox!.y)).toBeLessThan(40);

    // Title must not be clipped — it should be within the viewport width
    expect(titleBox!.x).toBeGreaterThanOrEqual(0);
    expect(titleBox!.x + titleBox!.width).toBeLessThanOrEqual(VIEWPORTS.mobile.width);
  });
});

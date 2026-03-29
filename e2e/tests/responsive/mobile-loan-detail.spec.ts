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

    // On mobile the button text should be truncated to "Record"
    const recordBtn = creditorPage.getByRole("button", { name: "Record" });
    await expect(recordBtn).toBeVisible();
    // Ensure the full "Record Payment" text is NOT shown
    await expect(
      creditorPage.getByRole("button", { name: "Record Payment" }),
    ).toBeHidden();
  });

  test("mobile: loan description is visible next to status badge", async ({
    creditorPage,
    loanDetailScenario,
  }) => {
    await creditorPage.setViewportSize(VIEWPORTS.mobile);
    const detail = new LoanDetailPage(creditorPage);
    await detail.goto(loanDetailScenario.loanId);

    // The loan title (description) should be visible at the top
    await expect(detail.loanTitle).toBeVisible();
    // The status badge should also be visible
    await expect(detail.statusBadge).toBeVisible();

    // Both should be in the viewport (not scrolled off or hidden)
    const titleBox = await detail.loanTitle.boundingBox();
    const badgeBox = await detail.statusBadge.boundingBox();
    expect(titleBox).not.toBeNull();
    expect(badgeBox).not.toBeNull();

    // Title and badge should be near each other vertically (same row or adjacent)
    expect(Math.abs(titleBox!.y - badgeBox!.y)).toBeLessThan(40);
  });
});

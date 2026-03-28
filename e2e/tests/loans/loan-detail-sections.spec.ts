import { test, expect } from "../../fixtures/data.fixture";
import { LoanDetailPage } from "../../pages/LoanDetailPage";

test.describe("L2-3.4: Loan detail page sections @smoke", () => {
  test("Payment History heading appears exactly once", async ({
    creditorPage,
    seededLoanId,
  }) => {
    const detail = new LoanDetailPage(creditorPage);
    await detail.goto(seededLoanId);

    const headings = creditorPage.getByRole("heading", {
      name: /Payment History/i,
    });
    await expect(headings).toHaveCount(1);
  });
});

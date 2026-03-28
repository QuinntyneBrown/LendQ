import { test as authTest } from "./auth.fixture";
import { ApiClient } from "../helpers/api-client";

type DataFixtures = {
  seededLoanId: string;
};

export const test = authTest.extend<DataFixtures>({
  seededLoanId: async ({ playwright }, use) => {
    const request = await playwright.request.newContext();
    const api = new ApiClient(request);
    const { access_token } = await api.login(
      "creditor@family.com",
      "password123",
    );

    // Get first existing creditor loan
    const loansRes = await request.get(
      "http://localhost:5000/api/v1/loans?view=creditor&page=1",
      { headers: { Authorization: `Bearer ${access_token}` } },
    );
    const loansData = await loansRes.json();

    let loanId: string;
    if (loansData.items && loansData.items.length > 0) {
      // Use the first active loan
      const activeLoan = loansData.items.find(
        (l: { status: string }) => l.status === "ACTIVE",
      );
      loanId = activeLoan ? activeLoan.id : loansData.items[0].id;
    } else {
      // Create a new loan if none exist
      const borrowerLogin = await api.login(
        "borrower@family.com",
        "password123",
      );
      const borrowerMeRes = await request.get(
        "http://localhost:5000/api/v1/auth/me",
        {
          headers: {
            Authorization: `Bearer ${borrowerLogin.access_token}`,
          },
        },
      );
      const borrower = await borrowerMeRes.json();

      const loan = await api.createLoan(access_token, {
        borrower_id: borrower.id,
        description: "E2E Test Loan",
        principal: 5000,
        interest_rate: 0,
        repayment_frequency: "MONTHLY",
        start_date: new Date().toISOString().split("T")[0],
      });
      loanId = loan.id;
    }

    await use(loanId);
    await request.dispose();
  },
});

export { expect } from "@playwright/test";

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

    // Get the borrower's ID
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

    // Create a fresh loan with future start date so all payments are Scheduled
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startDate = tomorrow.toISOString().split("T")[0];

    const loan = await api.createLoan(access_token, {
      borrower_id: borrower.id,
      description: "E2E Test Loan",
      principal: 2000,
      interest_rate: 0,
      repayment_frequency: "MONTHLY",
      num_payments: 10,
      start_date: startDate,
    });
    const loanId = loan.id;

    await use(loanId);
    await request.dispose();
  },
});

export { expect } from "@playwright/test";

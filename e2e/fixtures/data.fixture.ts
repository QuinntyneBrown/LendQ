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
    const loan = await api.createLoan(access_token, {
      borrower_id: "borrower-uuid",
      description: "E2E Test Loan",
      principal: 5000,
      interest_rate: 0,
      repayment_frequency: "MONTHLY",
      start_date: new Date().toISOString().split("T")[0],
    });
    await use(loan.id);
    await request.dispose();
  },
});

export { expect } from "@playwright/test";

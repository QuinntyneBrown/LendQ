import type { APIRequestContext } from "@playwright/test";
import { test as authTest } from "./auth.fixture";
import {
  seedHistoryScenario,
  seedLoan,
  seedPartialPaymentLoan,
  seedPausedLoan,
  seedPaidOffLoan,
  seedReadOnlyLoan,
  seedRescheduledLoan,
  seedTestData,
  type LoanScenario,
  type SeededData,
} from "../helpers/seed";

type DataFixtures = {
  seededLoanId: string;
  loanDetailScenario: LoanScenario;
  rescheduledLoanScenario: LoanScenario;
  pausedLoanScenario: LoanScenario;
  partialPaymentLoanScenario: LoanScenario;
  paidOffLoanScenario: LoanScenario;
  paymentHistoryScenario: LoanScenario;
};

type DataWorkerFixtures = {
  requestContext: APIRequestContext;
  seededData: SeededData;
  loanDetailScenarioWorker: LoanScenario;
  rescheduledLoanScenarioWorker: LoanScenario;
  pausedLoanScenarioWorker: LoanScenario;
  partialPaymentLoanScenarioWorker: LoanScenario;
  paidOffLoanScenarioWorker: LoanScenario;
  paymentHistoryScenarioWorker: LoanScenario;
};

export const test = authTest.extend<DataFixtures, DataWorkerFixtures>({
  requestContext: [async ({ playwright }, use) => {
    const request = await playwright.request.newContext();
    await use(request);
    await request.dispose();
  }, { scope: "worker" }],

  seededData: [async ({ requestContext }, use) => {
    const data = await seedTestData(requestContext);
    await use(data);
  }, { scope: "worker" }],

  loanDetailScenarioWorker: [async ({ requestContext, seededData }, use) => {
    await use(
      await seedReadOnlyLoan(
        requestContext,
        seededData.creditorToken,
        seededData.borrowerId,
      ),
    );
  }, { scope: "worker" }],

  rescheduledLoanScenarioWorker: [async ({ requestContext, seededData }, use) => {
    await use(
      await seedRescheduledLoan(
        requestContext,
        seededData.creditorToken,
        seededData.borrowerId,
      ),
    );
  }, { scope: "worker" }],

  pausedLoanScenarioWorker: [async ({ requestContext, seededData }, use) => {
    await use(
      await seedPausedLoan(
        requestContext,
        seededData.creditorToken,
        seededData.borrowerId,
      ),
    );
  }, { scope: "worker" }],

  partialPaymentLoanScenarioWorker: [async ({ requestContext, seededData }, use) => {
    await use(
      await seedPartialPaymentLoan(
        requestContext,
        seededData.creditorToken,
        seededData.borrowerId,
      ),
    );
  }, { scope: "worker" }],

  paidOffLoanScenarioWorker: [async ({ requestContext, seededData }, use) => {
    await use(
      await seedPaidOffLoan(
        requestContext,
        seededData.creditorToken,
        seededData.borrowerId,
      ),
    );
  }, { scope: "worker" }],

  paymentHistoryScenarioWorker: [async ({ requestContext, seededData }, use) => {
    await use(
      await seedHistoryScenario(
        requestContext,
        seededData.creditorToken,
        seededData.borrowerId,
      ),
    );
  }, { scope: "worker" }],

  loanDetailScenario: async ({ loanDetailScenarioWorker }, use) => {
    await use(loanDetailScenarioWorker);
  },

  rescheduledLoanScenario: async ({ rescheduledLoanScenarioWorker }, use) => {
    await use(rescheduledLoanScenarioWorker);
  },

  pausedLoanScenario: async ({ pausedLoanScenarioWorker }, use) => {
    await use(pausedLoanScenarioWorker);
  },

  partialPaymentLoanScenario: async ({ partialPaymentLoanScenarioWorker }, use) => {
    await use(partialPaymentLoanScenarioWorker);
  },

  paidOffLoanScenario: async ({ paidOffLoanScenarioWorker }, use) => {
    await use(paidOffLoanScenarioWorker);
  },

  paymentHistoryScenario: async ({ paymentHistoryScenarioWorker }, use) => {
    await use(paymentHistoryScenarioWorker);
  },

  seededLoanId: async ({ requestContext, seededData }, use) => {
    const loanId = await seedLoan(
      requestContext,
      seededData.creditorToken,
      seededData.borrowerId,
      {
        description: `E2E Mutable Loan ${Date.now()}`,
        principal: 2000,
        num_payments: 10,
      },
    );
    await use(loanId);
  },
});

export { expect } from "@playwright/test";

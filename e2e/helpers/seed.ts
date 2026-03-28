import { APIRequestContext } from "@playwright/test";
import { ApiClient } from "./api-client";

export interface SeededData {
  adminToken: string;
  creditorToken: string;
  borrowerToken: string;
  borrowerId: string;
}

export interface LoanScenario {
  loanId: string;
  originalDueDateLabel?: string;
  newDueDateLabel?: string;
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function isoDate(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split("T")[0];
}

export async function seedTestData(
  request: APIRequestContext,
): Promise<SeededData> {
  const api = new ApiClient(request);

  const adminLogin = await api.login("admin@family.com", "password123");
  const creditorLogin = await api.login(
    "creditor@family.com",
    "password123",
  );
  const borrowerLogin = await api.login(
    "borrower@family.com",
    "password123",
  );
  const borrower = await api.getMe(borrowerLogin.access_token);

  return {
    adminToken: adminLogin.access_token,
    creditorToken: creditorLogin.access_token,
    borrowerToken: borrowerLogin.access_token,
    borrowerId: borrower.id,
  };
}

export async function seedLoan(
  request: APIRequestContext,
  creditorToken: string,
  borrowerId: string,
  overrides: Record<string, unknown> = {},
): Promise<string> {
  const api = new ApiClient(request);
  const loan = await api.createLoan(creditorToken, {
    borrower_id: borrowerId,
    description: `E2E Loan ${Date.now()}`,
    principal: 5000,
    interest_rate: 0,
    repayment_frequency: "MONTHLY",
    num_payments: 12,
    start_date: isoDate(1),
    ...overrides,
  });
  return loan.id;
}

export async function seedReadOnlyLoan(
  request: APIRequestContext,
  creditorToken: string,
  borrowerId: string,
): Promise<LoanScenario> {
  const loanId = await seedLoan(request, creditorToken, borrowerId, {
    description: `E2E Read Only Loan ${Date.now()}`,
    principal: 2400,
    num_payments: 12,
  });

  return { loanId };
}

export async function seedRescheduledLoan(
  request: APIRequestContext,
  creditorToken: string,
  borrowerId: string,
): Promise<LoanScenario> {
  const api = new ApiClient(request);
  const loanId = await seedLoan(request, creditorToken, borrowerId, {
    description: `E2E Rescheduled Loan ${Date.now()}`,
  });
  const schedule = await api.getSchedule(creditorToken, loanId);
  const payment = schedule[0];
  const nextDate = new Date(payment.due_date);
  nextDate.setDate(nextDate.getDate() + 14);
  const newDate = nextDate.toISOString().split("T")[0];

  await api.reschedulePayment(creditorToken, payment.id, {
    new_date: newDate,
    reason: "Schedule adjustment",
  });

  return {
    loanId,
    originalDueDateLabel: formatDateLabel(payment.due_date),
    newDueDateLabel: formatDateLabel(newDate),
  };
}

export async function seedPausedLoan(
  request: APIRequestContext,
  creditorToken: string,
  borrowerId: string,
): Promise<LoanScenario> {
  const api = new ApiClient(request);
  const loanId = await seedLoan(request, creditorToken, borrowerId, {
    description: `E2E Paused Loan ${Date.now()}`,
  });
  const schedule = await api.getSchedule(creditorToken, loanId);
  await api.pausePayments(creditorToken, loanId, [schedule[0].id]);
  return { loanId };
}

export async function seedPartialPaymentLoan(
  request: APIRequestContext,
  creditorToken: string,
  borrowerId: string,
): Promise<LoanScenario> {
  const api = new ApiClient(request);
  const loanId = await seedLoan(request, creditorToken, borrowerId, {
    description: `E2E Partial Loan ${Date.now()}`,
  });
  const schedule = await api.getSchedule(creditorToken, loanId);
  const payment = schedule[0];

  await api.recordPayment(creditorToken, loanId, {
    amount: String(Number(payment.amount_due) / 2),
    paid_date: isoDate(2),
    notes: "Partial payment scenario",
  });

  return { loanId };
}

export async function seedPaidOffLoan(
  request: APIRequestContext,
  creditorToken: string,
  borrowerId: string,
): Promise<LoanScenario> {
  const api = new ApiClient(request);
  const loanId = await seedLoan(request, creditorToken, borrowerId, {
    description: `E2E Paid Loan ${Date.now()}`,
    principal: 200,
    num_payments: 1,
  });

  await api.recordPayment(creditorToken, loanId, {
    amount: "200",
    paid_date: isoDate(2),
    notes: "Paid-off scenario",
  });

  return { loanId };
}

export async function seedHistoryScenario(
  request: APIRequestContext,
  creditorToken: string,
  borrowerId: string,
): Promise<LoanScenario> {
  const api = new ApiClient(request);
  const loanId = await seedLoan(request, creditorToken, borrowerId, {
    description: `E2E History Loan ${Date.now()}`,
  });
  const schedule = await api.getSchedule(creditorToken, loanId);
  const firstPayment = schedule[0];
  const secondPayment = schedule[1];
  const nextDate = new Date(firstPayment.due_date);
  nextDate.setDate(nextDate.getDate() + 14);
  const newDate = nextDate.toISOString().split("T")[0];

  await api.reschedulePayment(creditorToken, firstPayment.id, {
    new_date: newDate,
    reason: "History scenario reschedule",
  });
  await api.pausePayments(creditorToken, loanId, [secondPayment.id]);
  await api.recordPayment(creditorToken, loanId, {
    amount: String(firstPayment.amount_due),
    paid_date: isoDate(2),
    notes: "History scenario payment",
  });

  return {
    loanId,
    originalDueDateLabel: formatDateLabel(firstPayment.due_date),
    newDueDateLabel: formatDateLabel(newDate),
  };
}

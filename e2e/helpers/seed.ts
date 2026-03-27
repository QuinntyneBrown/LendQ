import { APIRequestContext } from "@playwright/test";
import { ApiClient } from "./api-client";

export interface SeededData {
  adminToken: string;
  creditorToken: string;
  borrowerToken: string;
  loanId?: string;
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

  return {
    adminToken: adminLogin.access_token,
    creditorToken: creditorLogin.access_token,
    borrowerToken: borrowerLogin.access_token,
  };
}

export async function seedLoan(
  request: APIRequestContext,
  creditorToken: string,
): Promise<string> {
  const api = new ApiClient(request);
  const loan = await api.createLoan(creditorToken, {
    borrower_id: "borrower-uuid",
    description: "Test Loan",
    principal: 5000,
    interest_rate: 0,
    repayment_frequency: "MONTHLY",
    start_date: new Date().toISOString().split("T")[0],
  });
  return loan.id;
}

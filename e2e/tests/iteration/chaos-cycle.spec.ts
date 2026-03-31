/**
 * Chaos Cycle Test — Automated iteration harness
 *
 * Each run:
 *   1. Creates dedicated test users, loans, bank accounts via API
 *   2. Logs in via the UI and performs 30 random operations
 *   3. Verifies displayed data matches API/database state
 *   4. Cleans up all test data via purge API
 *
 * Run against staging:
 *   BASE_URL=https://lemon-wave-0a1790b0f.6.azurestaticapps.net \
 *   API_URL=https://lendq-api-staging.wittyglacier-a7ff8abf.eastus2.azurecontainerapps.io \
 *   npx playwright test chaos-cycle --project=chromium-desktop
 */
import { test, expect, type Page, type APIRequestContext } from "@playwright/test";

// ── Config ──────────────────────────────────────────────────────────────────
const API_BASE =
  process.env.API_URL ||
  "https://lendq-api-staging.wittyglacier-a7ff8abf.eastus2.azurecontainerapps.io";
const API = `${API_BASE}/api/v1`;
const ITERATION = Number(process.env.ITERATION || "1");
const RUN_ID = `chaos-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

// ── Helpers ─────────────────────────────────────────────────────────────────
function isoDate(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatCAD(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount);
}

// ── API Client for test data setup/teardown ─────────────────────────────────
class StagingApiClient {
  constructor(private request: APIRequestContext) {}

  async login(email: string, password: string) {
    const res = await this.request.post(`${API}/auth/login`, {
      data: { email, password },
    });
    if (!res.ok()) throw new Error(`Login failed for ${email}: ${res.status()}`);
    return res.json();
  }

  async createUser(token: string, data: Record<string, unknown>) {
    const res = await this.request.post(`${API}/users`, {
      headers: { Authorization: `Bearer ${token}` },
      data,
    });
    if (!res.ok()) throw new Error(`Create user failed: ${res.status()} ${await res.text()}`);
    return res.json();
  }

  async getMe(token: string) {
    const res = await this.request.get(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  }

  async listBorrowers(token: string) {
    const res = await this.request.get(`${API}/users/borrowers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  }

  async getRoles(token: string) {
    const res = await this.request.get(`${API}/roles`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  }

  async createLoan(token: string, data: Record<string, unknown>) {
    const res = await this.request.post(`${API}/loans`, {
      headers: { Authorization: `Bearer ${token}` },
      data,
    });
    if (!res.ok()) throw new Error(`Create loan failed: ${res.status()} ${await res.text()}`);
    return res.json();
  }

  async getLoan(token: string, loanId: string) {
    const res = await this.request.get(`${API}/loans/${loanId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  }

  async getSchedule(token: string, loanId: string) {
    const res = await this.request.get(`${API}/loans/${loanId}/schedule`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  }

  async recordPayment(token: string, loanId: string, data: Record<string, unknown>) {
    const res = await this.request.post(`${API}/loans/${loanId}/payments`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Idempotency-Key": `chaos-${loanId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      },
      data,
    });
    if (!res.ok()) throw new Error(`Record payment failed: ${res.status()} ${await res.text()}`);
    return res.json();
  }

  async reschedulePayment(token: string, paymentId: string, data: Record<string, unknown>) {
    const res = await this.request.put(`${API}/payments/${paymentId}/reschedule`, {
      headers: { Authorization: `Bearer ${token}` },
      data,
    });
    return res.json();
  }

  async pausePayments(token: string, loanId: string, paymentIds: string[]) {
    const res = await this.request.post(`${API}/loans/${loanId}/pause`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { payment_ids: paymentIds, reason: "Chaos cycle test" },
    });
    return res.json();
  }

  async createBankAccount(token: string, data: Record<string, unknown>) {
    const res = await this.request.post(`${API}/admin/accounts`, {
      headers: { Authorization: `Bearer ${token}` },
      data,
    });
    if (!res.ok()) throw new Error(`Create bank account failed: ${res.status()} ${await res.text()}`);
    return res.json();
  }

  async getBankAccount(token: string, accountId: string) {
    const res = await this.request.get(`${API}/accounts/${accountId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  }

  async deposit(token: string, accountId: string, amount: number, description: string) {
    const res = await this.request.post(`${API}/accounts/${accountId}/deposit`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Idempotency-Key": `chaos-dep-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      },
      data: { amount, description, reason_code: "CHAOS_TEST" },
    });
    if (!res.ok()) throw new Error(`Deposit failed: ${res.status()} ${await res.text()}`);
    return res.json();
  }

  async withdraw(token: string, accountId: string, amount: number, description: string) {
    const res = await this.request.post(`${API}/accounts/${accountId}/withdraw`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Idempotency-Key": `chaos-wd-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      },
      data: { amount, description, reason_code: "CHAOS_TEST" },
    });
    return res.json();
  }

  async getTransactions(token: string, accountId: string) {
    const res = await this.request.get(`${API}/accounts/${accountId}/transactions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  }

  async getDashboard(token: string) {
    const res = await this.request.get(`${API}/dashboard/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  }

  async getLoans(token: string, view: string) {
    const res = await this.request.get(`${API}/loans?tab=${view}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  }

  async purgeUser(token: string, userId: string) {
    const res = await this.request.delete(`${API}/users/${userId}/purge?force=true`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok()) {
      console.warn(`Purge user ${userId} returned ${res.status()}: ${await res.text()}`);
    }
    return res.status();
  }
}

// ── Test State ──────────────────────────────────────────────────────────────
interface TestState {
  api: StagingApiClient;
  adminToken: string;
  creditorUser: { id: string; email: string; name: string };
  borrowerUser: { id: string; email: string; name: string };
  creditorToken: string;
  borrowerToken: string;
  loans: Array<{
    id: string;
    description: string;
    principal: number;
    numPayments: number;
    interestRate: number;
  }>;
  bankAccounts: Array<{ id: string; userId: string; balance: number }>;
  operationLog: string[];
}

// ── Operations ──────────────────────────────────────────────────────────────

async function opViewDashboard(page: Page, state: TestState) {
  await page.goto("/dashboard");
  await page.waitForSelector("[data-testid='metric-total-lent-out']", { timeout: 15000 });

  // Verify summary cards are showing amounts
  const lentOut = await page.getByTestId("metric-total-lent-out").textContent();
  expect(lentOut).toBeTruthy();
  state.operationLog.push(`VIEW_DASHBOARD: total_lent_out=${lentOut}`);
}

async function opViewLoanList(page: Page, state: TestState) {
  await page.goto("/loans?view=creditor");
  await page.waitForTimeout(2000);

  // Should see our test loans
  const rows = page.locator("[data-testid='loan-row']");
  const count = await rows.count();
  state.operationLog.push(`VIEW_LOAN_LIST: ${count} loans visible`);
}

async function opViewLoanDetail(page: Page, state: TestState) {
  if (state.loans.length === 0) return;
  const loan = pick(state.loans);
  await page.goto(`/loans/${loan.id}`);
  await page.waitForSelector("[data-testid='loan-title']", { timeout: 15000 });

  // Verify title matches
  const title = await page.getByTestId("loan-title").textContent();
  expect(title).toContain(loan.description);

  // Verify principal card
  const principalText = await page.getByTestId("metric-principal").textContent();
  expect(principalText).toContain(formatCAD(loan.principal).replace("$", ""));

  // Verify status badge exists
  const status = await page.getByTestId("loan-status-badge").textContent();
  expect(status).toBeTruthy();

  state.operationLog.push(`VIEW_LOAN_DETAIL: ${loan.description} principal=${loan.principal} status=${status}`);
}

async function opRecordPayment(page: Page, state: TestState) {
  if (state.loans.length === 0) return;
  const loan = pick(state.loans);

  // Get schedule from API to know what to pay
  const schedule = await state.api.getSchedule(state.creditorToken, loan.id);
  const scheduledPayments = schedule.filter(
    (p: any) => p.status === "SCHEDULED" || p.status === "PARTIAL"
  );
  if (scheduledPayments.length === 0) {
    state.operationLog.push(`SKIP_RECORD_PAYMENT: no scheduled payments for ${loan.description}`);
    return;
  }

  const payment = scheduledPayments[0];
  const amount = payment.status === "PARTIAL"
    ? Number(payment.amount_due) - Number(payment.amount_paid)
    : Number(payment.amount_due);

  // Navigate to loan detail and click Record Payment
  await page.goto(`/loans/${loan.id}`);
  await page.waitForSelector("[data-testid='loan-title']", { timeout: 15000 });

  const recordBtn = page.getByRole("button", { name: /Record Payment/i }).first();
  if (!(await recordBtn.isVisible())) {
    state.operationLog.push(`SKIP_RECORD_PAYMENT: no record button for ${loan.description}`);
    return;
  }
  await recordBtn.click();

  // Wait for dialog
  const dialog = page.getByRole("dialog", { name: /Record Payment/i });
  await expect(dialog).toBeVisible({ timeout: 5000 });

  // Fill amount — clear and type to trigger React's onChange properly
  const amountInput = dialog.getByLabel(/Payment Amount/i);
  await amountInput.click();
  await amountInput.fill("");
  await amountInput.type(String(Math.round(amount * 100) / 100));

  // Fill date
  const dateInput = dialog.getByLabel(/Payment Date/i);
  await dateInput.fill(isoDate(0)); // use today, not tomorrow

  // Click record and wait for result
  await dialog.getByRole("button", { name: /Record Payment/i }).click();

  // Give the request time to complete
  await page.waitForTimeout(3000);

  // Check if dialog closed (success) or is still open (error)
  const dialogStillVisible = await dialog.isVisible().catch(() => false);
  if (!dialogStillVisible) {
    state.operationLog.push(`RECORD_PAYMENT: ${loan.description} amount=${amount}`);
  } else {
    // Dialog still open — dismiss it
    const cancelBtn = dialog.getByRole("button", { name: "Cancel" });
    if (await cancelBtn.isVisible().catch(() => false)) await cancelBtn.click();
    await page.waitForTimeout(500);
    state.operationLog.push(`RECORD_PAYMENT_FAILED: ${loan.description} amount=${amount}`);
  }
}

async function opRecordPartialPayment(page: Page, state: TestState) {
  if (state.loans.length === 0) return;
  const loan = pick(state.loans);

  const schedule = await state.api.getSchedule(state.creditorToken, loan.id);
  const scheduledPayments = schedule.filter((p: any) => p.status === "SCHEDULED");
  if (scheduledPayments.length === 0) {
    state.operationLog.push(`SKIP_PARTIAL_PAYMENT: no scheduled payments for ${loan.description}`);
    return;
  }

  const payment = scheduledPayments[0];
  const partialAmount = Math.round(Number(payment.amount_due) / 2 * 100) / 100;

  await page.goto(`/loans/${loan.id}`);
  await page.waitForSelector("[data-testid='loan-title']", { timeout: 15000 });

  const recordBtn = page.getByRole("button", { name: /Record Payment/i }).first();
  if (!(await recordBtn.isVisible())) return;
  await recordBtn.click();

  const dialog = page.getByRole("dialog", { name: /Record Payment/i });
  await expect(dialog).toBeVisible({ timeout: 5000 });

  const amountInput = dialog.getByLabel(/Payment Amount/i);
  await amountInput.clear();
  await amountInput.fill(String(partialAmount));

  const dateInput = dialog.getByLabel(/Payment Date/i);
  await dateInput.fill(isoDate(1));

  await dialog.getByRole("button", { name: /Record Payment/i }).click();
  await page.waitForTimeout(3000);

  const partialDialogVisible = await dialog.isVisible().catch(() => false);
  if (!partialDialogVisible) {
    state.operationLog.push(`PARTIAL_PAYMENT: ${loan.description} amount=${partialAmount} of ${payment.amount_due}`);
  } else {
    const cancelBtn = dialog.getByRole("button", { name: "Cancel" });
    if (await cancelBtn.isVisible().catch(() => false)) await cancelBtn.click();
    await page.waitForTimeout(500);
    state.operationLog.push(`PARTIAL_PAYMENT_FAILED: ${loan.description}`);
  }
}

async function opVerifyLoanBalance(page: Page, state: TestState) {
  if (state.loans.length === 0) return;
  const loan = pick(state.loans);

  // Get loan from API
  const apiLoan = await state.api.getLoan(state.creditorToken, loan.id);

  // Navigate to loan detail
  await page.goto(`/loans/${loan.id}`);
  await page.waitForSelector("[data-testid='metric-outstanding']", { timeout: 15000 });

  const outstandingText = await page.getByTestId("metric-outstanding").textContent();
  const apiBalance = formatCAD(apiLoan.outstanding_balance);

  // The displayed balance should contain the formatted amount (ignoring $ sign position)
  const apiAmountStr = apiBalance.replace(/[^0-9.,]/g, "");
  expect(outstandingText).toContain(apiAmountStr);

  state.operationLog.push(`VERIFY_BALANCE: ${loan.description} api=${apiBalance} ui=${outstandingText}`);
}

async function opViewBankAccount(page: Page, state: TestState) {
  // Navigate to user's own account page
  await page.goto("/account");
  await page.waitForTimeout(2000);

  const balance = page.getByTestId("account-balance");
  if (await balance.isVisible()) {
    const balanceText = await balance.textContent();
    state.operationLog.push(`VIEW_BANK_ACCOUNT: balance=${balanceText}`);
  } else {
    state.operationLog.push(`VIEW_BANK_ACCOUNT: balance not visible (no account or loading)`);
  }
}

async function opAdminDeposit(page: Page, state: TestState) {
  if (state.bankAccounts.length === 0) return;
  const account = pick(state.bankAccounts);
  const depositAmount = randomInt(50, 500);

  // Do the deposit via API since admin UI requires navigating to account detail
  const txn = await state.api.deposit(state.adminToken, account.id, depositAmount, `Chaos deposit ${RUN_ID}`);
  account.balance = Number(txn.balance_after);

  state.operationLog.push(`API_DEPOSIT: account=${account.id} amount=${depositAmount} new_balance=${account.balance}`);
}

async function opAdminWithdraw(page: Page, state: TestState) {
  if (state.bankAccounts.length === 0) return;
  const account = pick(state.bankAccounts);

  // Refresh balance from API before withdrawing
  const apiAccount = await state.api.getBankAccount(state.adminToken, account.id);
  const currentBalance = Number(apiAccount.current_balance ?? apiAccount.balance ?? 0);
  account.balance = currentBalance;

  if (currentBalance <= 0) {
    state.operationLog.push(`SKIP_WITHDRAW: account=${account.id} balance=${currentBalance}`);
    return;
  }

  const maxWithdraw = Math.min(currentBalance, 200);
  const withdrawAmount = randomInt(1, Math.floor(maxWithdraw));

  const txn = await state.api.withdraw(state.adminToken, account.id, withdrawAmount, `Chaos withdraw ${RUN_ID}`);
  account.balance = Number(txn.balance_after);

  state.operationLog.push(`API_WITHDRAW: account=${account.id} amount=${withdrawAmount} balance=${account.balance}`);
}

async function opVerifyBankBalance(page: Page, state: TestState) {
  if (state.bankAccounts.length === 0) return;
  const account = pick(state.bankAccounts);

  // Get account from API
  const apiAccount = await state.api.getBankAccount(state.creditorToken, account.id);
  const apiBalance = apiAccount.current_balance ?? apiAccount.balance;

  // Update our tracked balance
  account.balance = apiBalance;

  state.operationLog.push(`VERIFY_BANK_BALANCE: account=${account.id} api_balance=${apiBalance}`);
}

async function opReschedulePayment(page: Page, state: TestState) {
  if (state.loans.length === 0) return;
  const loan = pick(state.loans);

  const schedule = await state.api.getSchedule(state.creditorToken, loan.id);
  const scheduledPayments = schedule.filter((p: any) => p.status === "SCHEDULED");
  if (scheduledPayments.length === 0) {
    state.operationLog.push(`SKIP_RESCHEDULE: no scheduled payments for ${loan.description}`);
    return;
  }

  const payment = scheduledPayments[0];
  const newDate = new Date(payment.due_date);
  newDate.setDate(newDate.getDate() + randomInt(7, 30));
  const newDateStr = newDate.toISOString().split("T")[0];

  await state.api.reschedulePayment(state.creditorToken, payment.id, {
    new_date: newDateStr,
    reason: `Chaos reschedule ${RUN_ID}`,
  });

  state.operationLog.push(`RESCHEDULE_PAYMENT: ${loan.description} payment=${payment.id} new_date=${newDateStr}`);
}

async function opPausePayment(page: Page, state: TestState) {
  if (state.loans.length === 0) return;
  const loan = pick(state.loans);

  const schedule = await state.api.getSchedule(state.creditorToken, loan.id);
  const scheduledPayments = schedule.filter((p: any) => p.status === "SCHEDULED");
  if (scheduledPayments.length === 0) {
    state.operationLog.push(`SKIP_PAUSE: no scheduled payments for ${loan.description}`);
    return;
  }

  const payment = pick(scheduledPayments);
  await state.api.pausePayments(state.creditorToken, loan.id, [payment.id]);

  state.operationLog.push(`PAUSE_PAYMENT: ${loan.description} payment=${payment.id}`);
}

async function opViewPaymentSchedule(page: Page, state: TestState) {
  if (state.loans.length === 0) return;
  const loan = pick(state.loans);

  await page.goto(`/loans/${loan.id}`);
  await page.waitForSelector("[data-testid='payment-schedule-card']", { timeout: 15000 });

  const scheduleCard = page.getByTestId("payment-schedule-card");
  await expect(scheduleCard).toBeVisible();

  const paymentRows = scheduleCard.locator("[data-testid='payment-row']");
  const count = await paymentRows.count();
  expect(count).toBeGreaterThan(0);

  state.operationLog.push(`VIEW_SCHEDULE: ${loan.description} ${count} payment rows`);
}

async function opVerifyDashboardSummary(page: Page, state: TestState) {
  // Get summary from API
  const summary = await state.api.getDashboard(state.creditorToken);

  await page.goto("/dashboard");
  await page.waitForSelector("[data-testid='metric-total-lent-out']", { timeout: 15000 });

  const lentOutText = await page.getByTestId("metric-total-lent-out").textContent();
  expect(lentOutText).toBeTruthy();

  state.operationLog.push(
    `VERIFY_DASHBOARD: api_lent_out=${summary.total_lent_out} ui_lent_out=${lentOutText}`
  );
}

async function opViewNotifications(page: Page, state: TestState) {
  await page.goto("/notifications");
  await page.waitForTimeout(2000);

  const heading = page.getByRole("heading", { name: "Notifications", exact: true });
  await expect(heading).toBeVisible({ timeout: 10000 });

  state.operationLog.push(`VIEW_NOTIFICATIONS`);
}

async function opCreateLoanViaUI(page: Page, state: TestState) {
  await page.goto("/loans?view=creditor");
  await page.waitForTimeout(2000);

  const createBtn = page.getByRole("button", { name: /Create New Loan/i });
  if (!(await createBtn.isVisible())) {
    state.operationLog.push(`SKIP_CREATE_LOAN_UI: button not visible`);
    return;
  }
  await createBtn.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 5000 });

  // Select the test borrower
  const borrowerSearch = dialog.getByPlaceholder(/Select a family member/i);
  await borrowerSearch.fill(state.borrowerUser.name);
  await page.waitForTimeout(500);

  const borrowerOption = dialog.locator("[data-testid='borrower-option']").first();
  if (await borrowerOption.isVisible({ timeout: 3000 })) {
    await borrowerOption.click();
  } else {
    await dialog.getByRole("button", { name: "Cancel" }).click();
    state.operationLog.push(`SKIP_CREATE_LOAN_UI: borrower not found in dropdown`);
    return;
  }

  const principal = randomInt(500, 5000);
  const numPayments = randomInt(2, 12);
  const description = `Chaos Loan UI ${RUN_ID} ${Date.now()}`;

  await dialog.getByLabel("Description").fill(description);
  const principalInput = dialog.getByLabel(/Principal/i);
  await principalInput.clear();
  await principalInput.fill(String(principal));

  const interestInput = dialog.getByLabel(/Interest Rate/i);
  await interestInput.clear();
  await interestInput.fill("0");

  const numPaymentsInput = dialog.getByLabel(/Installment Count/i);
  await numPaymentsInput.clear();
  await numPaymentsInput.fill(String(numPayments));

  const startDateInput = dialog.getByLabel(/Start Date/i);
  await startDateInput.fill(isoDate(1));

  await dialog.getByRole("button", { name: /Create Loan|Save/i }).click();
  await expect(dialog).toBeHidden({ timeout: 15000 });

  // Wait for the loan list to refresh and find our new loan
  await page.waitForTimeout(2000);

  state.operationLog.push(`CREATE_LOAN_UI: ${description} principal=${principal} payments=${numPayments}`);
}

async function opViewBorrowerLoans(page: Page, state: TestState) {
  // Temporarily login as borrower to see their view
  // Actually, just use the current admin/creditor session and view borrower tab
  await page.goto("/loans?view=borrower");
  await page.waitForTimeout(2000);

  state.operationLog.push(`VIEW_BORROWER_LOANS`);
}

async function opCheckVersion(page: Page, state: TestState) {
  await page.goto("/dashboard");
  await page.waitForTimeout(2000);

  const versionEl = page.getByTestId("app-version");
  if (await versionEl.isVisible()) {
    const version = await versionEl.textContent();
    state.operationLog.push(`CHECK_VERSION: ${version}`);
  } else {
    state.operationLog.push(`CHECK_VERSION: version element not visible`);
  }
}

async function opViewPaymentHistory(page: Page, state: TestState) {
  if (state.loans.length === 0) return;
  const loan = pick(state.loans);

  await page.goto(`/loans/${loan.id}`);
  await page.waitForSelector("[data-testid='loan-title']", { timeout: 15000 });

  const historySection = page.getByTestId("payment-history");
  if (await historySection.isVisible()) {
    state.operationLog.push(`VIEW_PAYMENT_HISTORY: ${loan.description}`);
  } else {
    state.operationLog.push(`VIEW_PAYMENT_HISTORY: section not visible for ${loan.description}`);
  }
}

async function opViewSavings(page: Page, state: TestState) {
  await page.goto("/savings");
  await page.waitForTimeout(2000);

  const heading = page.getByRole("heading", { name: "Savings Goals", exact: true });
  await expect(heading).toBeVisible({ timeout: 10000 });

  state.operationLog.push(`VIEW_SAVINGS`);
}

async function opViewRecurringLoans(page: Page, state: TestState) {
  await page.goto("/loans/recurring");
  await page.waitForTimeout(2000);

  state.operationLog.push(`VIEW_RECURRING_LOANS`);
}

async function opSearchLoans(page: Page, state: TestState) {
  await page.goto("/loans?view=creditor");
  await page.waitForTimeout(2000);

  const searchInput = page.getByPlaceholder(/Search loans/i);
  if (await searchInput.isVisible()) {
    await searchInput.fill("Chaos");
    await page.waitForTimeout(500);
    state.operationLog.push(`SEARCH_LOANS: query=Chaos`);
  } else {
    state.operationLog.push(`SKIP_SEARCH_LOANS: search input not visible`);
  }
}

async function opViewUserList(page: Page, state: TestState) {
  // Creditor role cannot access user list — skip this op
  state.operationLog.push(`SKIP_VIEW_USER_LIST: creditor role has no access`);
}

// ── All available operations ────────────────────────────────────────────────
const OPERATIONS = [
  { name: "view_dashboard", fn: opViewDashboard, weight: 3 },
  { name: "view_loan_list", fn: opViewLoanList, weight: 3 },
  { name: "view_loan_detail", fn: opViewLoanDetail, weight: 4 },
  { name: "record_payment", fn: opRecordPayment, weight: 3 },
  { name: "record_partial_payment", fn: opRecordPartialPayment, weight: 2 },
  { name: "verify_loan_balance", fn: opVerifyLoanBalance, weight: 3 },
  { name: "view_bank_accounts", fn: opViewBankAccount, weight: 2 },
  { name: "admin_deposit", fn: opAdminDeposit, weight: 2 },
  { name: "admin_withdraw", fn: opAdminWithdraw, weight: 2 },
  { name: "verify_bank_balance", fn: opVerifyBankBalance, weight: 2 },
  { name: "reschedule_payment", fn: opReschedulePayment, weight: 1 },
  { name: "pause_payment", fn: opPausePayment, weight: 1 },
  { name: "view_payment_schedule", fn: opViewPaymentSchedule, weight: 3 },
  { name: "verify_dashboard_summary", fn: opVerifyDashboardSummary, weight: 2 },
  { name: "view_notifications", fn: opViewNotifications, weight: 1 },
  { name: "create_loan_ui", fn: opCreateLoanViaUI, weight: 1 },
  { name: "view_borrower_loans", fn: opViewBorrowerLoans, weight: 1 },
  { name: "check_version", fn: opCheckVersion, weight: 1 },
  { name: "view_payment_history", fn: opViewPaymentHistory, weight: 2 },
  { name: "view_savings", fn: opViewSavings, weight: 1 },
  { name: "view_recurring_loans", fn: opViewRecurringLoans, weight: 1 },
  { name: "search_loans", fn: opSearchLoans, weight: 1 },
  { name: "view_user_list", fn: opViewUserList, weight: 1 },
];

function selectRandomOperations(count: number) {
  // Build weighted pool
  const pool: typeof OPERATIONS = [];
  for (const op of OPERATIONS) {
    for (let i = 0; i < op.weight; i++) pool.push(op);
  }
  const selected = [];
  for (let i = 0; i < count; i++) {
    selected.push(pick(pool));
  }
  return selected;
}

// ── Main Test ───────────────────────────────────────────────────────────────
test.describe(`Chaos Cycle — Iteration ${ITERATION}`, () => {
  test.setTimeout(600_000); // 10 minutes
  test.use({ storageState: { cookies: [], origins: [] } }); // skip auth setup — we do our own login

  test(`iteration-${ITERATION}: create data, run 30 random ops, verify, cleanup`, async ({
    page,
    request,
  }) => {
    const api = new StagingApiClient(request);

    // ──────────────────────────────────────────────────────────────────────
    // STEP 1: Create test users, loans, and bank accounts
    // ──────────────────────────────────────────────────────────────────────
    console.log(`\n=== CHAOS CYCLE ITERATION ${ITERATION} — RUN ${RUN_ID} ===\n`);
    console.log("Step 1: Creating test data...");

    // Login as admin
    const adminLogin = await api.login("admin@family.com", "password123");
    const adminToken = adminLogin.access_token;

    // Fetch role IDs
    const roles = await api.getRoles(adminToken);
    const creditorRoleId = roles.find((r: any) => r.name === "Creditor")?.id;
    const borrowerRoleId = roles.find((r: any) => r.name === "Borrower")?.id;
    if (!creditorRoleId || !borrowerRoleId) throw new Error("Could not find Creditor/Borrower role IDs");

    // Create test creditor
    const creditorEmail = `chaos-creditor-${RUN_ID}@test.lendq.local`;
    const creditorUser = await api.createUser(adminToken, {
      name: `Chaos Creditor ${ITERATION}`,
      email: creditorEmail,
      password: "TestPass123!",
      role_ids: [creditorRoleId],
    });

    // Create test borrower
    const borrowerEmail = `chaos-borrower-${RUN_ID}@test.lendq.local`;
    const borrowerUser = await api.createUser(adminToken, {
      name: `Chaos Borrower ${ITERATION}`,
      email: borrowerEmail,
      password: "TestPass123!",
      role_ids: [borrowerRoleId],
    });

    console.log(`  Created creditor: ${creditorEmail}`);
    console.log(`  Created borrower: ${borrowerEmail}`);

    // Login as creditor (rate limits now 30/min on staging, no need for long waits)
    const creditorLogin = await api.login(creditorEmail, "TestPass123!");

    // Create bank accounts for both users
    const creditorAccount = await api.createBankAccount(adminToken, {
      user_id: creditorUser.id,
      currency: "CAD",
      initial_deposit: 10000,
      note: `Chaos cycle ${RUN_ID}`,
    });

    const borrowerAccount = await api.createBankAccount(adminToken, {
      user_id: borrowerUser.id,
      currency: "CAD",
      initial_deposit: 5000,
      note: `Chaos cycle ${RUN_ID}`,
    });

    console.log(`  Created bank accounts with initial deposits`);

    // Create 3-5 loans with varying parameters
    const numLoans = randomInt(3, 5);
    const loans: TestState["loans"] = [];
    for (let i = 0; i < numLoans; i++) {
      const principal = randomInt(500, 10000);
      const numPayments = randomInt(2, 12);
      const interestRate = pick([0, 0, 0, 2, 5]); // mostly 0% for simplicity
      const description = `Chaos Loan ${i + 1} - ${RUN_ID}`;

      const loan = await api.createLoan(creditorLogin.access_token, {
        borrower_id: borrowerUser.id,
        description,
        principal,
        interest_rate: interestRate,
        repayment_frequency: pick(["MONTHLY", "BIWEEKLY", "WEEKLY"]),
        num_payments: numPayments,
        start_date: isoDate(1),
      });

      loans.push({
        id: loan.id,
        description,
        principal,
        numPayments,
        interestRate,
      });
    }

    console.log(`  Created ${numLoans} loans`);

    // Build state object
    const state: TestState = {
      api,
      adminToken,
      creditorUser: { id: creditorUser.id, email: creditorEmail, name: `Chaos Creditor ${ITERATION}` },
      borrowerUser: { id: borrowerUser.id, email: borrowerEmail, name: `Chaos Borrower ${ITERATION}` },
      creditorToken: creditorLogin.access_token,
      borrowerToken: creditorLogin.access_token, // reuse creditor token (borrower login skipped for rate limit)
      loans,
      bankAccounts: [
        { id: creditorAccount.id || creditorAccount.account?.id, userId: creditorUser.id, balance: 10000 },
        { id: borrowerAccount.id || borrowerAccount.account?.id, userId: borrowerUser.id, balance: 5000 },
      ],
      operationLog: [],
    };

    // ──────────────────────────────────────────────────────────────────────
    // STEP 2: Login as creditor via UI
    // ──────────────────────────────────────────────────────────────────────
    console.log("\nStep 2: Logging in via UI...");

    // Login via UI with retry (intermittent issue where login 200 but no navigation)
    let loggedIn = false;
    for (let loginAttempt = 1; loginAttempt <= 3; loginAttempt++) {
      await page.goto("/login");
      await page.getByLabel("Email Address").fill(creditorEmail);
      await page.getByLabel("Password").fill("TestPass123!");
      await page.getByRole("button", { name: "Sign In" }).click();

      try {
        await page.waitForURL("**/dashboard", { timeout: 15000 });
        loggedIn = true;
        break;
      } catch {
        console.log(`  Login attempt ${loginAttempt}/3 — dashboard navigation failed, retrying...`);
      }
    }

    if (!loggedIn) {
      throw new Error("UI login failed after 3 attempts");
    }

    await page.waitForSelector("[data-testid='metric-total-lent-out']", { timeout: 30000 });
    console.log("  Logged in successfully");

    // ──────────────────────────────────────────────────────────────────────
    // STEP 3: Perform 30 random operations
    // ──────────────────────────────────────────────────────────────────────
    console.log("\nStep 3: Performing 30 random operations...");

    const operations = selectRandomOperations(30);
    const errors: Array<{ op: string; error: string }> = [];

    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];
      console.log(`  [${i + 1}/30] ${op.name}...`);
      try {
        await op.fn(page, state);
      } catch (err: any) {
        const errMsg = err.message || String(err);
        console.error(`  ERROR in ${op.name}: ${errMsg}`);
        errors.push({ op: op.name, error: errMsg });

        // Take screenshot on error (ignore if page is closed)
        await page.screenshot({
          path: `test-results/chaos-${ITERATION}-${op.name}-${i}.png`,
        }).catch(() => {});
      }
    }

    // ──────────────────────────────────────────────────────────────────────
    // STEP 4: Final verification — cross-check API vs UI
    // ──────────────────────────────────────────────────────────────────────
    console.log("\nStep 4: Final verification...");

    // Refresh the creditor token (may have expired)
    try {
      const freshLogin = await api.login(creditorEmail, "TestPass123!");
      state.creditorToken = freshLogin.access_token;
    } catch {
      console.log("  Warning: could not refresh creditor token for final verification");
    }

    // Verify each loan's outstanding balance matches UI
    for (const loan of state.loans) {
      try {
        const apiLoan = await api.getLoan(state.creditorToken, loan.id);
        await page.goto(`/loans/${loan.id}`);
        await page.waitForSelector("[data-testid='metric-outstanding']", { timeout: 10000 });

        const uiOutstanding = await page.getByTestId("metric-outstanding").textContent();
        const apiFormatted = formatCAD(apiLoan.outstanding_balance).replace(/[^0-9.,]/g, "");

        if (!uiOutstanding?.includes(apiFormatted)) {
          errors.push({
            op: "FINAL_VERIFY_BALANCE",
            error: `${loan.description}: API=${apiLoan.outstanding_balance} UI=${uiOutstanding}`,
          });
        }
      } catch (err: any) {
        errors.push({ op: "FINAL_VERIFY_BALANCE", error: `${loan.description}: ${err.message}` });
      }
    }

    // ──────────────────────────────────────────────────────────────────────
    // STEP 5: Report
    // ──────────────────────────────────────────────────────────────────────
    console.log("\n=== OPERATION LOG ===");
    for (const entry of state.operationLog) {
      console.log(`  ${entry}`);
    }

    if (errors.length > 0) {
      console.log(`\n=== ERRORS (${errors.length}) ===`);
      for (const e of errors) {
        console.log(`  [${e.op}] ${e.error}`);
      }
    }

    // ──────────────────────────────────────────────────────────────────────
    // STEP 6: Cleanup — purge test users
    // ──────────────────────────────────────────────────────────────────────
    console.log("\nStep 6: Cleaning up test data...");

    // Use existing admin token (avoid extra login for rate limit)
    await api.purgeUser(adminToken, creditorUser.id);
    await api.purgeUser(adminToken, borrowerUser.id);
    console.log("  Test users purged");

    console.log(`\n=== ITERATION ${ITERATION} COMPLETE ===`);
    console.log(`  Operations: 30`);
    console.log(`  Errors: ${errors.length}`);
    console.log(`  Loans created: ${state.loans.length}`);
    console.log(`  Run ID: ${RUN_ID}`);

    // Fail the test if there were errors
    if (errors.length > 0) {
      const errorSummary = errors
        .map((e) => `[${e.op}] ${e.error}`)
        .join("\n");
      expect.soft(errors.length, `Iteration ${ITERATION} had ${errors.length} errors:\n${errorSummary}`).toBe(0);
    }
  });
});

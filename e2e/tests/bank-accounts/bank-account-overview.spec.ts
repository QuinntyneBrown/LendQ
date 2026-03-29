import { test, expect } from "../../fixtures/auth.fixture";
import { BankAccountPage } from "../../pages/BankAccountPage";
import { DepositWithdrawDialog } from "../../pages/DepositWithdrawDialog";
import { RecurringDepositDialog } from "../../pages/RecurringDepositDialog";
import { ToastComponent } from "../../pages/ToastComponent";

test.describe("L1-13: Bank Account Overview @smoke", () => {
  test("user can view their bank account balance", async ({ creditorPage }) => {
    const accountPage = new BankAccountPage(creditorPage);
    await accountPage.goto();
    await accountPage.expectVisible();
    await expect(accountPage.balanceDisplay).toBeVisible();
  });

  test("admin can deposit funds into an account", async ({ adminPage }) => {
    const accountPage = new BankAccountPage(adminPage);
    const dialog = new DepositWithdrawDialog(adminPage);
    const toast = new ToastComponent(adminPage);

    await accountPage.goto();
    await accountPage.clickDeposit();
    await dialog.expectOpen();
    await dialog.fillAmount("500.00");
    await dialog.fillReason("MANUAL_DEPOSIT");
    await dialog.clickConfirm();
    await dialog.expectClosed();
    await toast.expectToast("success", "deposit");
  });

  test("admin can deposit then withdraw funds", async ({ adminPage }) => {
    const accountPage = new BankAccountPage(adminPage);
    const dialog = new DepositWithdrawDialog(adminPage);
    const toast = new ToastComponent(adminPage);

    // First deposit to ensure balance
    await accountPage.goto();
    await accountPage.clickDeposit();
    await dialog.expectOpen();
    await dialog.fillAmount("1000.00");
    await dialog.fillReason("SEED_DEPOSIT");
    await dialog.clickConfirm();
    await dialog.expectClosed();
    await toast.waitForToast("success");
    await toast.closeToast(0);

    // Now withdraw
    await accountPage.clickWithdraw();
    await dialog.expectOpen();
    await dialog.fillAmount("100.00");
    await dialog.fillReason("MANUAL_WITHDRAWAL");
    await dialog.clickConfirm();
    await dialog.expectClosed();
    await toast.expectToast("success", "withdraw");
  });

  test("user can view transaction history", async ({ creditorPage }) => {
    const accountPage = new BankAccountPage(creditorPage);
    await accountPage.goto();
    await expect(creditorPage.getByText(/Transaction/i).first()).toBeVisible();
  });

  test("user can set up a recurring deposit", async ({ creditorPage }) => {
    const accountPage = new BankAccountPage(creditorPage);
    const dialog = new RecurringDepositDialog(creditorPage);
    const toast = new ToastComponent(creditorPage);

    await accountPage.goto();
    await accountPage.clickSetupRecurring();
    await dialog.expectOpen();
    await dialog.fillAmount("100.00");
    await dialog.fillSourceDescription("Weekly Allowance");
    await dialog.selectFrequency("WEEKLY");
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    await dialog.fillStartDate(startDate.toISOString().split("T")[0]);
    await dialog.clickCreate();
    await dialog.expectClosed();
    await toast.expectToast("success", "created");
  });
});

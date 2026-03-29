import { test, expect } from "../../fixtures/auth.fixture";
import { BankAccountPage } from "../../pages/BankAccountPage";
import { DepositWithdrawDialog } from "../../pages/DepositWithdrawDialog";
import { SavingsGoalListPage } from "../../pages/SavingsGoalListPage";
import { SavingsGoalDetailPage } from "../../pages/SavingsGoalDetailPage";
import { CreateEditSavingsGoalDialog } from "../../pages/CreateEditSavingsGoalDialog";
import { AddFundsDialog } from "../../pages/AddFundsDialog";
import { ToastComponent } from "../../pages/ToastComponent";

test.describe("End-to-end: Bank Account -> Savings Goal flow @smoke", () => {
  test("user deposits funds then contributes to a savings goal", async ({ adminPage, creditorPage }) => {
    const toast = new ToastComponent(creditorPage);

    // Step 1: Admin deposits funds into user's account
    const adminAccountPage = new BankAccountPage(adminPage);
    const depositDialog = new DepositWithdrawDialog(adminPage);
    const adminToast = new ToastComponent(adminPage);

    await adminAccountPage.goto();
    await adminAccountPage.clickDeposit();
    await depositDialog.fillAmount("2000.00");
    await depositDialog.fillReason("INITIAL_DEPOSIT");
    await depositDialog.clickConfirm();
    await depositDialog.expectClosed();
    await adminToast.expectToast("success", "deposited");

    // Step 2: User creates a savings goal
    const goalList = new SavingsGoalListPage(creditorPage);
    const createDialog = new CreateEditSavingsGoalDialog(creditorPage);

    const goalName = `E2E Vacation Fund ${Date.now()}`;
    await goalList.goto();
    await goalList.clickCreate();
    await createDialog.fillName(goalName);
    await createDialog.fillTargetAmount("1000");
    await createDialog.clickSave();
    await createDialog.expectClosed();
    await toast.expectToast("success", "created");

    // Step 3: User adds funds to the goal
    await goalList.clickGoal(0);
    const detailPage = new SavingsGoalDetailPage(creditorPage);
    await detailPage.clickAddFunds();
    const addFundsDialog = new AddFundsDialog(creditorPage);
    await addFundsDialog.fillAmount("500.00");
    await addFundsDialog.clickAdd();
    await addFundsDialog.expectClosed();
    await toast.expectToast("success", "added");

    // Step 4: Verify progress updated
    await detailPage.expectStatus("In Progress");
  });
});

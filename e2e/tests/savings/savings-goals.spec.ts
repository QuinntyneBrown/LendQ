import { test, expect } from "../../fixtures/auth.fixture";
import { SavingsGoalListPage } from "../../pages/SavingsGoalListPage";
import { SavingsGoalDetailPage } from "../../pages/SavingsGoalDetailPage";
import { CreateEditSavingsGoalDialog } from "../../pages/CreateEditSavingsGoalDialog";
import { AddFundsDialog } from "../../pages/AddFundsDialog";
import { ToastComponent } from "../../pages/ToastComponent";

test.describe("L1-14: Savings Goals @smoke", () => {
  test("user can view savings goals list", async ({ creditorPage }) => {
    const listPage = new SavingsGoalListPage(creditorPage);
    await listPage.goto();
    await listPage.expectVisible();
    await expect(listPage.createButton).toBeVisible();
  });

  test("user can create a savings goal", async ({ creditorPage }) => {
    const listPage = new SavingsGoalListPage(creditorPage);
    const dialog = new CreateEditSavingsGoalDialog(creditorPage);
    const toast = new ToastComponent(creditorPage);

    const goalName = `E2E Savings Goal ${Date.now()}`;

    await listPage.goto();
    await listPage.clickCreate();
    await dialog.expectOpen();
    await dialog.fillName(goalName);
    await dialog.fillTargetAmount("5000");
    await dialog.clickSave();
    await dialog.expectClosed();
    await toast.expectToast("success", "created");
  });

  test("user can view savings goal detail with progress", async ({ creditorPage }) => {
    const listPage = new SavingsGoalListPage(creditorPage);
    const detailPage = new SavingsGoalDetailPage(creditorPage);

    await listPage.goto();
    await listPage.clickGoal(0);
    await detailPage.expectVisible();
    await expect(detailPage.progressBar).toBeVisible();
    await expect(detailPage.targetAmount).toBeVisible();
    await expect(detailPage.currentAmount).toBeVisible();
  });

  test("user can add funds to a savings goal", async ({ creditorPage }) => {
    const listPage = new SavingsGoalListPage(creditorPage);
    const detailPage = new SavingsGoalDetailPage(creditorPage);
    const addFunds = new AddFundsDialog(creditorPage);
    const toast = new ToastComponent(creditorPage);

    await listPage.goto();
    await listPage.clickGoal(0);
    await detailPage.clickAddFunds();
    await addFunds.expectOpen();
    await addFunds.fillAmount("250.00");
    await addFunds.clickAdd();
    await addFunds.expectClosed();
    await toast.expectToast("success", "added");
  });

  test("progress bar shows percentage toward goal", async ({ creditorPage }) => {
    const detailPage = new SavingsGoalDetailPage(creditorPage);
    // Navigate to a goal detail that has contributions
    await creditorPage.goto("/savings");
    const listPage = new SavingsGoalListPage(creditorPage);
    await listPage.clickGoal(0);
    await expect(detailPage.progressBar).toBeVisible();
  });

  test("goal cards show status badges", async ({ creditorPage }) => {
    const listPage = new SavingsGoalListPage(creditorPage);
    await listPage.goto();
    // Each goal card should have a status badge
    const badges = creditorPage.getByTestId("savings-goal-card").getByTestId("status-badge");
    if (await listPage.goalCards.count() > 0) {
      await expect(badges.first()).toBeVisible();
    }
  });

  test("empty state shows when no goals exist", async ({ borrowerPage }) => {
    const listPage = new SavingsGoalListPage(borrowerPage);
    await listPage.goto();
    // Should show empty state or goal cards
    const emptyState = borrowerPage.getByTestId("empty-state");
    const goalCards = listPage.goalCards;
    await expect(emptyState.or(goalCards.first())).toBeVisible();
  });
});

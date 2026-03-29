import { type Locator, type Page, expect } from "@playwright/test";

export class SavingsGoalDetailPage {
  readonly page: Page;
  readonly goalName: Locator;
  readonly progressBar: Locator;
  readonly targetAmount: Locator;
  readonly currentAmount: Locator;
  readonly addFundsButton: Locator;
  readonly editButton: Locator;
  readonly statusBadge: Locator;
  readonly contributionRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.goalName = page.getByTestId("goal-name");
    this.progressBar = page.getByTestId("progress-bar");
    this.targetAmount = page.getByTestId("metric-target");
    this.currentAmount = page.getByTestId("metric-saved");
    this.addFundsButton = page.getByRole("button", { name: /Add Funds/i });
    this.editButton = page.getByRole("button", { name: /Edit/i });
    this.statusBadge = page.getByTestId("goal-status-badge");
    this.contributionRows = page.getByTestId("contribution-row");
  }

  async goto(goalId: string) {
    await this.page.goto(`/savings/${goalId}`);
  }

  async expectVisible() {
    await expect(this.goalName).toBeVisible();
  }

  async expectStatus(status: string) {
    await expect(this.statusBadge).toContainText(status);
  }

  async clickAddFunds() {
    await this.addFundsButton.click();
  }

  async clickEdit() {
    await this.editButton.click();
  }
}

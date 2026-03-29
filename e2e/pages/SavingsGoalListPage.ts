import { type Locator, type Page, expect } from "@playwright/test";

export class SavingsGoalListPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly createButton: Locator;
  readonly goalCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByRole("heading", { name: /Savings/i });
    this.createButton = page.getByRole("button", { name: /Create|New Goal/i });
    this.goalCards = page.getByTestId("savings-goal-card");
  }

  async goto() {
    await this.page.goto("/savings");
  }

  async expectVisible() {
    await expect(this.pageTitle).toBeVisible();
  }

  async clickCreate() {
    await this.createButton.click();
  }

  async expectGoalCount(count: number) {
    await expect(this.goalCards).toHaveCount(count);
  }

  async expectGoalName(index: number, name: string) {
    await expect(this.goalCards.nth(index)).toContainText(name);
  }

  async clickGoal(index: number) {
    await this.goalCards.nth(index).click();
  }
}

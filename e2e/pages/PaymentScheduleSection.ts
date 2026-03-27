import { type Locator, type Page, expect } from "@playwright/test";

export class PaymentScheduleSection {
  readonly page: Page;
  readonly container: Locator;
  readonly paymentRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.getByTestId("payment-schedule-card");
    this.paymentRows = this.container.locator("[data-testid='payment-row']");
  }

  row(index: number) {
    return this.paymentRows.nth(index);
  }

  statusBadge(index: number) {
    return this.row(index).locator("[data-testid='status-badge']");
  }

  recordButton(index: number) {
    return this.row(index).getByRole("button", { name: /Record/i });
  }

  rescheduleButton(index: number) {
    return this.row(index).getByRole("button", { name: /Reschedule/i });
  }

  pauseButton(index: number) {
    return this.row(index).getByRole("button", { name: /Pause/i });
  }

  resumeButton(index: number) {
    return this.row(index).getByRole("button", { name: /Resume/i });
  }

  originalDate(index: number) {
    return this.row(index).locator("[data-testid='original-date']");
  }

  async clickRecordPayment(index: number) {
    await this.recordButton(index).click();
  }

  async clickReschedule(index: number) {
    await this.rescheduleButton(index).click();
  }

  async clickPause(index: number) {
    await this.pauseButton(index).click();
  }

  async clickResume(index: number) {
    await this.resumeButton(index).click();
  }

  async expectPaymentCount(n: number) {
    await expect(this.paymentRows).toHaveCount(n);
  }

  async expectPaymentStatus(index: number, status: string) {
    await expect(this.statusBadge(index)).toContainText(status);
  }

  async expectOriginalDateStrikethrough(index: number, date: string) {
    const el = this.originalDate(index);
    await expect(el).toContainText(date);
    await expect(el).toHaveCSS("text-decoration-line", "line-through");
  }

  async expectActionsForStatus(index: number, status: string) {
    switch (status) {
      case "Scheduled":
        await expect(this.recordButton(index)).toBeVisible();
        await expect(this.rescheduleButton(index)).toBeVisible();
        await expect(this.pauseButton(index)).toBeVisible();
        break;
      case "Overdue":
        await expect(this.recordButton(index)).toBeVisible();
        await expect(this.rescheduleButton(index)).toBeVisible();
        break;
      case "Paused":
        await expect(this.resumeButton(index)).toBeVisible();
        break;
      case "Paid":
        await expect(this.recordButton(index)).toBeHidden();
        break;
    }
  }
}

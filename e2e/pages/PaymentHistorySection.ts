import { type Locator, type Page, expect } from "@playwright/test";

export class PaymentHistorySection {
  readonly page: Page;
  readonly container: Locator;
  readonly historyEntries: Locator;
  readonly filterDropdown: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.getByTestId("payment-history");
    this.historyEntries = this.container.locator("[data-testid='history-entry']");
    this.filterDropdown = this.container.getByTestId("history-filter");
  }

  entry(index: number) {
    return this.historyEntries.nth(index);
  }

  entryIcon(index: number) {
    return this.entry(index).locator("[data-testid='entry-icon']");
  }

  entryDescription(index: number) {
    return this.entry(index).locator("[data-testid='entry-description']");
  }

  entryTimestamp(index: number) {
    return this.entry(index).locator("[data-testid='entry-timestamp']");
  }

  changeDetail(index: number) {
    return this.entry(index).locator("[data-testid='change-detail']");
  }

  async filterByType(type: string) {
    await this.filterDropdown.selectOption(type);
  }

  async expectEntryCount(n: number) {
    await expect(this.historyEntries).toHaveCount(n);
  }

  async expectEntry(index: number, description: string) {
    await expect(this.entryDescription(index)).toContainText(description);
  }

  async expectChangeDetail(index: number, oldVal: string, newVal: string) {
    const detail = this.changeDetail(index);
    await expect(detail).toContainText(oldVal);
    await expect(detail).toContainText(newVal);
  }
}

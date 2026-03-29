import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/projects/LendQ/e2e/node_modules/playwright');

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

// Login as creditor
await page.goto('http://localhost:5173/login');
await page.getByLabel('Email Address').fill('creditor@family.com');
await page.getByLabel('Password').fill('password123');
await page.getByRole('button', { name: 'Sign In' }).click();
await page.waitForURL('**/dashboard', { timeout: 10000 });

// Create a savings goal first
await page.goto('http://localhost:5173/savings');
await page.waitForTimeout(1000);
await page.getByRole('button', { name: /Create New Goal/i }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: 'C:/projects/LendQ/audit/live-create-goal-modal.png', fullPage: false });
console.log('Create goal modal screenshot taken');

await page.getByLabel('Goal Name').fill('Vacation Fund');
await page.getByLabel('Target Amount').fill('5000');
await page.getByRole('button', { name: /Create Goal/i }).click();
await page.waitForTimeout(2000);

// Now navigate to savings list and click the goal
await page.goto('http://localhost:5173/savings');
await page.waitForTimeout(1500);
await page.screenshot({ path: 'C:/projects/LendQ/audit/live-savings-with-goals.png', fullPage: true });
console.log('Savings list with goals screenshot taken');

// Click first goal to get detail
const goalCard = page.getByTestId('savings-goal-card').first();
if (await goalCard.isVisible()) {
  await goalCard.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'C:/projects/LendQ/audit/live-savings-detail.png', fullPage: true });
  console.log('Savings detail screenshot taken');
}

// Login as admin for bank account modals
await page.evaluate(() => localStorage.clear());
await page.goto('http://localhost:5173/login');
await page.waitForTimeout(1000);
await page.getByLabel('Email Address').fill('admin@family.com');
await page.getByLabel('Password').fill('password123');
await page.getByRole('button', { name: 'Sign In' }).click();
await page.waitForURL('**/dashboard', { timeout: 10000 });

await page.goto('http://localhost:5173/account');
await page.waitForTimeout(1000);
await page.getByRole('button', { name: /Deposit/i }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: 'C:/projects/LendQ/audit/live-deposit-modal.png', fullPage: false });
console.log('Deposit modal screenshot taken');
await page.getByRole('button', { name: /Cancel/i }).click();
await page.waitForTimeout(300);

// Recurring deposit modal
await page.getByRole('button', { name: /Set Up Recurring/i }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: 'C:/projects/LendQ/audit/live-recurring-deposit-modal.png', fullPage: false });
console.log('Recurring deposit modal screenshot taken');
await page.keyboard.press('Escape');
await page.waitForTimeout(300);

// Recurring loan detail
await page.goto('http://localhost:5173/loans/recurring');
await page.waitForTimeout(1000);
const row = page.getByTestId('recurring-loan-row').first();
if (await row.isVisible()) {
  await row.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'C:/projects/LendQ/audit/live-recurring-detail.png', fullPage: true });
  console.log('Recurring loan detail screenshot taken');
}

await browser.close();
console.log('Done!');

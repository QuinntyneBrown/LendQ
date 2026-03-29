import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/projects/LendQ/e2e/node_modules/playwright');

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

// Login first
console.log('Navigating to login...');
await page.goto('http://localhost:5173/login');
await page.waitForTimeout(1000);
await page.screenshot({ path: 'C:/projects/LendQ/audit/live-login.png', fullPage: true });
console.log('Login page screenshot taken');

await page.getByLabel('Email Address').fill('admin@family.com');
await page.getByLabel('Password').fill('password123');
await page.getByRole('button', { name: 'Sign In' }).click();
await page.waitForURL('**/dashboard', { timeout: 10000 });
console.log('Logged in, on dashboard');

// Screenshot dashboard
await page.waitForTimeout(2000);
await page.screenshot({ path: 'C:/projects/LendQ/audit/live-dashboard.png', fullPage: true });
console.log('Dashboard screenshot taken');

// Screenshot bank account page
console.log('Navigating to bank account...');
await page.goto('http://localhost:5173/account');
await page.waitForTimeout(2000);
await page.screenshot({ path: 'C:/projects/LendQ/audit/live-bank-account.png', fullPage: true });
console.log('Bank account screenshot taken');

// Screenshot savings goals page
console.log('Navigating to savings goals...');
await page.goto('http://localhost:5173/savings');
await page.waitForTimeout(2000);
await page.screenshot({ path: 'C:/projects/LendQ/audit/live-savings-goals.png', fullPage: true });
console.log('Savings goals screenshot taken');

// Screenshot recurring loans page
console.log('Navigating to recurring loans...');
await page.goto('http://localhost:5173/loans/recurring');
await page.waitForTimeout(2000);
await page.screenshot({ path: 'C:/projects/LendQ/audit/live-recurring-loans.png', fullPage: true });
console.log('Recurring loans screenshot taken');

await browser.close();
console.log('Done! All screenshots saved to C:/projects/LendQ/audit/');

# Screenshots

This folder holds the inline images referenced from the user guide pages. Images are PNGs named by their numbered slot in the guide.

If an image file here does not yet exist, the user guide page references a placeholder — the guide still reads correctly, but the visual reference is missing. This file explains how to capture each one.

## Capturing screenshots

### Fastest path — run the demo stack locally

1. Start the full stack with demo data — see [Local Development](../15-local-development.md).
2. Open the relevant page in your browser at `http://localhost:5173`.
3. Take a screenshot of just the main content area (exclude the browser chrome and the OS taskbar — most tools allow this with a region select).
4. Save as `<slot-number>-<kebab-case-title>.png` in this folder.

### Using Playwright for consistent captures

The `e2e/` folder has Playwright installed. You can drive the browser to a stable page and take a screenshot:

```bash
cd e2e
npx playwright test --headed --debug tests/auth/login.spec.ts
# or write a tiny script:
```

```ts
// e2e/capture-screenshots.ts
import { chromium } from "@playwright/test";

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto("http://localhost:5173/login");
  await page.screenshot({
    path: "../docs/user-guide/screenshots/01-login.png",
    fullPage: false,
  });
  await browser.close();
})();
```

Run with `npx tsx capture-screenshots.ts`.

### Recommended capture settings

- **Viewport width:** 1280 px (desktop), 390 px (mobile iPhone-style), 768 px (tablet).
- **Theme:** light mode (the default).
- **Data:** use the `demo` seed so every screenshot has realistic sample data.
- **PII:** none — the demo seed uses fake names and emails.
- **Format:** PNG, lossless.
- **File size:** target under 250 KB each. Use `pngquant` or `squoosh-cli` if needed.

## Required images

Capture what you can; missing files degrade gracefully (markdown just shows broken image text).

| File | Where it's used | Page state to capture |
|---|---|---|
| `01-login.png` | [01-getting-started.md](../01-getting-started.md) | `/login` with the form empty |
| `02-signup.png` | [01-getting-started.md](../01-getting-started.md) | `/signup` with the form empty |
| `03-forgot-password.png` | [01-getting-started.md](../01-getting-started.md) | `/forgot-password` with the form empty |
| `04-dashboard.png` | [02-dashboard.md](../02-dashboard.md) | `/dashboard` as the demo admin user |
| `05-layout-desktop.png` | [03-navigation.md](../03-navigation.md) | Any page at 1280 px width — sidebar visible |
| `06-layout-mobile.png` | [03-navigation.md](../03-navigation.md) | Any page at 390 px width — bottom nav visible |
| `07-loans-list.png` | [04-loans.md](../04-loans.md) | `/loans` with at least 3 demo loans |
| `08-loans-create.png` | [04-loans.md](../04-loans.md) | `/loans` with the Create Loan dialog open, partially filled |
| `09-loan-detail.png` | [04-loans.md](../04-loans.md) | `/loans/:id` for a demo active loan |
| `10-record-payment.png` | [05-payments.md](../05-payments.md) | Record Payment dialog open on a loan detail page |
| `11-recurring-list.png` | [06-recurring-loans.md](../06-recurring-loans.md) | `/loans/recurring` with at least one demo template |
| `12-recurring-detail.png` | [06-recurring-loans.md](../06-recurring-loans.md) | `/loans/recurring/:id` for a demo active template |
| `13-account-overview.png` | [07-bank-account.md](../07-bank-account.md) | `/account` as a borrower with recent transactions |
| `14-deposit-dialog.png` | [07-bank-account.md](../07-bank-account.md) | Deposit dialog open, amount partially filled |
| `15-savings-list.png` | [08-savings-goals.md](../08-savings-goals.md) | `/savings` with 2–3 goals in different statuses |
| `16-savings-create.png` | [08-savings-goals.md](../08-savings-goals.md) | Create Goal dialog open |
| `17-savings-detail.png` | [08-savings-goals.md](../08-savings-goals.md) | `/savings/:id` with contribution history |
| `18-notifications-bell.png` | [09-notifications.md](../09-notifications.md) | Header with bell dropdown open, 2–3 unread items |
| `19-notifications-list.png` | [09-notifications.md](../09-notifications.md) | `/notifications` list grouped by date |
| `20-notifications-preferences.png` | [09-notifications.md](../09-notifications.md) | `/settings` scrolled to the Notification Preferences section |
| `21-settings.png` | [10-settings.md](../10-settings.md) | `/settings` full page |
| `22-users-list.png` | [11-admin-users.md](../11-admin-users.md) | `/users` as admin, with search populated |
| `23-user-dialog.png` | [11-admin-users.md](../11-admin-users.md) | Add User dialog open, partially filled |
| `24-roles-list.png` | [12-admin-roles.md](../12-admin-roles.md) | `/users/roles` showing the 3 built-in role cards |
| `25-role-editor.png` | [12-admin-roles.md](../12-admin-roles.md) | Permission editor dialog open on the Creditor role |
| `26-admin-accounts-list.png` | [13-admin-bank-accounts.md](../13-admin-bank-accounts.md) | `/admin/accounts` with status filter on All |
| `27-admin-account-detail.png` | [13-admin-bank-accounts.md](../13-admin-bank-accounts.md) | `/admin/accounts/:id` for a demo account |
| `28-account-status-dialog.png` | [13-admin-bank-accounts.md](../13-admin-bank-accounts.md) | Change Account Status dialog open |

## Optimizing the PNGs

Once captured, shrink before committing:

```bash
# using pngquant
for f in *.png; do pngquant --quality=70-85 --ext .png --force "$f"; done

# using squoosh-cli
npx @squoosh/cli --oxipng auto *.png
```

Target: < 250 KB per image, total < 5 MB for the folder.

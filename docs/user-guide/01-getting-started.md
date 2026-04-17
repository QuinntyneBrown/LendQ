# Getting Started

This page walks you from "I have a link to LendQ" to signed-in and looking at your dashboard.

## 1. Open LendQ

Open the URL your administrator gave you. For the staging environment this is usually served via Azure Static Web Apps; in local development it is `http://localhost:5173`.

You will land on the **Sign In** page.

![Sign-in page](screenshots/01-login.png)

## 2. Create an account

If this is your first time on LendQ and an administrator has not already provisioned your account:

1. Click **Sign up** at the bottom of the sign-in form.
2. Fill in the form:
   - **Full Name** — how you want to appear to other users.
   - **Email Address** — used for sign-in, password resets, and notifications.
   - **Password** — minimum 8 characters, must include at least one letter and one digit.
   - **Confirm Password** — must match.
3. Click **Create Account**.
4. You will see a success screen that says to check your email to verify the address.

![Sign-up form](screenshots/02-signup.png)

> **Note:** New self-service signups receive the `Borrower` role by default. To become a creditor or administrator, ask an existing admin to update your role — see [User Management](11-admin-users.md).

## 3. Verify your email

Open the verification email and click the link. If the email never arrives, see [Troubleshooting › Email not received](16-troubleshooting.md#email-not-received).

## 4. Sign in

1. Enter your **Email Address** and **Password**.
2. (Optional) Toggle **Remember me** to keep the session after closing the browser.
3. Click **Sign In**.

If you typed the wrong password too many times in a row, LendQ will return **HTTP 429 — Too many attempts**. Wait a minute and try again.

## 5. Forgot your password

1. On the sign-in page, click **Forgot password?**.
2. Enter the email address on your account.
3. Click **Send reset link**.
4. Open the email from LendQ and click the link.
5. On the reset page, enter a new password twice and click **Reset Password**.

LendQ always returns the same "check your email" message regardless of whether the address is on file, so nobody can use the form to enumerate accounts.

![Forgot password](screenshots/03-forgot-password.png)

## 6. Your first look around

After signing in you land on the **Dashboard**. The top-level areas are:

- **Left sidebar (desktop)** or **Bottom tab bar (mobile)** — navigates between sections.
- **Header bell icon** — unread notifications.
- **User avatar (sidebar footer)** — sign out.

See [Navigation and Layout](03-navigation.md) for the full map and [Dashboard](02-dashboard.md) for what the landing page shows.

## 7. Sign out

- **Desktop:** click your name in the sidebar footer → **Sign out**.
- **Mobile:** tap **More** in the bottom nav → **Sign out**.

Signing out invalidates the current session token only. To invalidate every session on every device (useful if a device was lost), use **Sign out everywhere** on the [Settings](10-settings.md) page.

# Troubleshooting

A problem-oriented reference. Find your symptom, apply the fix. If nothing here matches, the next steps are:

1. Capture the `X-Request-ID` header from the failing request (open browser DevTools → Network → click the request → Response headers).
2. Send it to the administrator with a short description and timestamp.
3. Admins can match the request ID against backend logs to pinpoint the issue.

## Sign-in and accounts

### Invalid credentials

**Symptom:** "Invalid email or password" on the sign-in page.

**Fix:**

1. Double-check the email spelling.
2. Use **Forgot password?** to reset if unsure.
3. If you recently changed email in Admin, use the new one.

### Too many attempts (HTTP 429)

**Symptom:** Red toast "Too many attempts. Please try again in a minute."

**Cause:** The sign-in endpoint is rate-limited (default 30/minute; see `RATE_LIMIT_AUTH`).

**Fix:** Wait a minute, then retry. If you're an admin seeing this across many users, raise `RATE_LIMIT_AUTH` in the deployment env.

### Email not received

**Symptom:** Signed up or asked for a password reset, no email arrives.

**Fix:**

1. Check the spam folder.
2. On local dev, open Mailpit at `http://localhost:8025` — emails go there instead of a real inbox.
3. On staging/production, confirm SMTP env vars (`MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`) are set correctly.
4. If SMTP is fine, check backend logs for errors from the `email_service`.

### Reset link expired

**Symptom:** Opening the reset link shows "This link has expired."

**Cause:** Reset tokens live for a limited window (default 1 hour).

**Fix:** Request a fresh link from the [Forgot Password](01-getting-started.md#5-forgot-your-password) flow.

### Forbidden (HTTP 403)

**Symptom:** "Access forbidden" or redirected away from an admin page.

**Cause:** Your account doesn't have the required role.

**Fix:** Ask an admin to review your roles in [User Management](11-admin-users.md).

### Kicked to sign-in unexpectedly

**Symptom:** Using the app, then redirected to `/login` mid-session.

**Cause:** Access token expired and refresh failed — often because you were signed out elsewhere.

**Fix:** Sign back in. If it keeps happening, check whether another device is doing **Sign out everywhere** on your account.

## Loans

### "Failed to create loan"

**Cause:** Usually a validation error — principal ≤ 0, rate out of range, start date in the past.

**Fix:** Read the inline error under each field. Adjust and resubmit.

### Borrower can't see a loan they expect to see

**Cause:** Wrong borrower selected at creation time.

**Fix:** Open the loan detail → confirm the borrower. If wrong, pause the incorrect loan and recreate with the correct borrower. There is no self-service fix to change the borrower on an existing loan.

### Schedule shows only one row

**Cause:** `Number of Payments` was 1.

**Fix:** Click **Edit Loan** and inspect terms. You cannot change the number of payments after creation — create a new loan with the correct number if needed.

### Status stuck at Overdue after payment recorded

**Cause:** Payment amount covered current row but an older row is still unpaid.

**Fix:** Check the schedule for `OVERDUE` or `PARTIALLY_PAID` rows and record payments against those.

## Payments

### Dialog says "Payment Amount must be greater than 0"

**Cause:** Zero or negative amount entered.

**Fix:** Enter a positive number.

### Duplicate payment rows

**Cause:** Rare race between browsers using different idempotency keys.

**Fix:** An admin can reverse the duplicate via the API. There is no self-service reversal — payments are immutable to preserve audit.

### Payment recorded but balance didn't change

**Cause:** Stale cached data.

**Fix:** Reload the loan detail page.

## Notifications

### Bell badge never updates

**Cause:** SSE connection blocked by a proxy or corporate firewall.

**Fix:** Reload the page to retrigger; fall back to the list page which polls on load. Ask IT to allow `text/event-stream` to the API domain.

### Emails arrive but bell is empty

**Cause:** Wrong account signed in.

**Fix:** Sign out; sign back in as the notified user.

### Preference toggle doesn't save

**Cause:** Network error or backend rejection.

**Fix:** Red toast appears and toggle reverts. Check DevTools Network tab for the failing `PUT /api/v1/notifications/preferences` response.

## Bank accounts

### Deposit/Withdraw buttons are missing

**Cause:** Account is `FROZEN`, `CLOSED`, or `NO_ACCOUNT`.

**Fix:**

- `FROZEN` — contact an Admin to unfreeze.
- `CLOSED` — a closed account cannot be reopened; ask for a new one.
- `NO_ACCOUNT` — ask an Admin to [create an account](13-admin-bank-accounts.md#create-an-account-for-a-user).

### "Insufficient balance"

**Cause:** Withdrawal exceeds current balance.

**Fix:** Deposit more first, or lower the amount.

### Recurring deposit didn't fire

**Cause:**

- Schedule is `PAUSED` or `CANCELLED`.
- Scheduler (Celery Beat) isn't running.
- Clock skew between the scheduler and the database.

**Fix:** Check schedule status. If `ACTIVE` and still missing, admins should check the Beat container logs.

## Savings goals

### "Insufficient balance" when adding funds

**Cause:** Bank account balance below the contribution amount.

**Fix:** Deposit into the bank account first, then retry.

### Goal stays `In Progress` past 100%

**Cause:** Transient caching; in rare cases a race.

**Fix:** Reload. If it persists, contact an Admin.

### Released funds didn't return to bank account

**Cause:** Release-to-bank feature disabled in this deployment.

**Fix:** Confirm with an Admin. The balance is still tracked in contribution history — no money is "lost," it's just not automatically moved.

## Admin / deploy

### Deploy workflow fails at Azure login

**Cause:** `AZURE_CREDENTIALS` secret expired or revoked.

**Fix:** Regenerate the service principal, update the GitHub secret, rerun the workflow. See [Deployment](14-deployment.md#github-secrets-required).

### Migrations hang

**Cause:** A long-running migration or the migration container couldn't pull the image.

**Fix:**

```bash
az containerapp job execution list \
  --name lendq-migrate-staging \
  --resource-group rg-lendq-staging
```

Check the most recent execution's status and logs. Kill and rerun if stuck.

### API 502 after deploy

**Cause:** New revision failed to start (bad env var, broken migration, missing secret).

**Fix:**

```bash
az containerapp logs show \
  --name lendq-api-staging \
  --resource-group rg-lendq-staging \
  --follow
```

Read the startup logs, fix the root cause, redeploy. You can roll back to the previous revision while you investigate — see [Deployment › Rolling back](14-deployment.md#rolling-back).

### Frontend shows old API URL

**Cause:** `VITE_API_BASE_URL` is baked into the static bundle at build time.

**Fix:** Update the workflow's env var and rerun the `Deploy to Staging` job.

### CORS error in browser

**Cause:** Frontend origin isn't in the API's `CORS_ORIGINS` list.

**Fix:** Update `CORS_ORIGINS` on the Container App:

```bash
az containerapp update \
  --name lendq-api-staging \
  --resource-group rg-lendq-staging \
  --set-env-vars "CORS_ORIGINS=https://swa-lendq-staging.azurestaticapps.net,https://my-other-domain"
```

## Collecting evidence for a bug report

When you open a ticket for anything above, include:

1. **What you did** — step-by-step.
2. **What you expected** — what should have happened.
3. **What happened instead** — error text, status code, screenshot.
4. **Request ID** — `X-Request-ID` response header, visible in DevTools → Network → the failing request.
5. **Timestamp** (with timezone) — used to narrow log search.
6. **Account email** — so the admin knows which user ran into it.
7. **Browser and OS** — for UI bugs.

Admins can then correlate via the request ID in Application Insights (production) or the Container App log stream (staging).

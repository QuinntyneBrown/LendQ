# Staging Email Provider Options

## Current State

The staging environment has no working email delivery. `MAIL_HOST` defaults to `localhost:1025` (Mailpit dev sink), which silently fails inside the Azure Container App. Affected flows:

- Password reset (forgot-password sends a tokenized link)
- Email verification (signup sends a confirmation link)
- Payment reminders and overdue notifications (Celery worker jobs)

Regardless of provider chosen, the following code changes are required:

| File | Change |
|------|--------|
| `backend/app/services/email_service.py` | Add TLS + auth to SMTP, or swap to provider SDK |
| `backend/app/services/email_service.py` | Replace hardcoded `http://localhost:5173` reset URL with config value |
| `backend/app/services/email_service.py` | Replace `noreply@lendq.local` sender with real address |
| `backend/app/config.py` | Add `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`, `FRONTEND_URL` config |
| `ops/azure/modules/container-apps.bicep` | Add mail env vars to container app |
| `.github/workflows/deploy-staging.yml` | Set mail env vars or secrets |

---

## Option 1: Resend

**What**: Developer-focused transactional email API. REST/SDK-based, no SMTP needed.

| | |
|---|---|
| **Free tier** | 100 emails/day, 1 domain |
| **Setup effort** | ~30 min |
| **Domain verification** | Required (DNS TXT record) OR use `onboarding@resend.dev` for testing |
| **SDK** | `pip install resend` — 5-line send call |
| **Human in the loop** | DNS record for domain verification (unless using test sender) |

**Pros**
- Excellent developer experience, minimal code
- Built-in delivery tracking and logs in dashboard
- Generous free tier for staging
- Webhook support for bounce/complaint handling
- No SMTP configuration complexity

**Cons**
- Third-party dependency outside Azure ecosystem
- Requires Resend account creation (manual signup)
- Domain verification needs DNS access
- Vendor lock-in on API (though easy to swap)

**Can be fully automated (no human)?** Partially. Code changes and deployment can be automated. Account signup and DNS verification require a human. Using the `onboarding@resend.dev` test sender avoids DNS but limits the sender address.

**Code change**:
```python
import resend
resend.api_key = os.environ["RESEND_API_KEY"]

def send_email(self, to, subject, body):
    resend.Emails.send({
        "from": os.environ.get("MAIL_FROM", "noreply@lendq.com"),
        "to": to,
        "subject": subject,
        "html": body,
    })
```

---

## Option 2: Gmail SMTP with App Password

**What**: Use a Gmail account as an SMTP relay via App Password.

| | |
|---|---|
| **Free tier** | 500 emails/day |
| **Setup effort** | ~15 min |
| **Domain verification** | None (sends from @gmail.com) |
| **SDK** | None — uses stdlib `smtplib` already in code |
| **Human in the loop** | Must create App Password in Google Account settings (requires 2FA enabled) |

**Pros**
- Zero cost
- No new dependencies — uses existing `smtplib` code with minor changes
- No domain verification needed
- Familiar and well-documented
- Fast to set up

**Cons**
- Sends from a @gmail.com address (not branded)
- Google can throttle or block if flagged as spam
- App Password must be created manually in Google Account
- Not suitable for production (rate limits, deliverability)
- Tied to a personal/shared Google account

**Can be fully automated (no human)?** No. Creating the App Password requires logging into Google Account with 2FA and generating the password manually. Once created, the rest (code + deploy) is automatable.

**Code change** (minimal — add 2 lines to existing `send_email`):
```python
with smtplib.SMTP(host, port) as server:
    server.starttls()
    server.login(username, password)  # MAIL_USERNAME, MAIL_PASSWORD from env
    server.send_message(msg)
```

**Env vars**:
```
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-gmail@gmail.com
MAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx  # App Password
MAIL_FROM=your-gmail@gmail.com
```

---

## Option 3: Azure Communication Services (ACS) Email

**What**: Azure-native email service. Supports SMTP relay or REST API.

| | |
|---|---|
| **Free tier** | 100 emails/day on ACS free tier |
| **Setup effort** | ~45 min |
| **Domain verification** | Required (Azure-managed subdomain available as shortcut) |
| **SDK** | `pip install azure-communication-email` or use SMTP relay |
| **Human in the loop** | Portal provisioning of ACS resource + email domain |

**Pros**
- Native to Azure — same billing, same portal, same IAM
- Azure-managed subdomain option (`xxxxxxxx.azurecomm.net`) avoids custom DNS
- SMTP relay option means zero code change (just set env vars)
- Enterprise-grade deliverability and compliance
- Managed Identity auth possible (no API keys)

**Cons**
- More complex initial setup (ACS resource → Communication Service → Email → Domain → Sender)
- Azure portal steps cannot be fully scripted via Bicep (email domain provisioning is partially manual)
- Verbose SDK compared to Resend
- Overkill for staging-only use

**Can be fully automated (no human)?** No. The ACS resource can be created via Bicep, but email domain provisioning and sender address setup require portal interaction. The Azure-managed subdomain shortcut reduces DNS work but still needs portal clicks.

**SMTP relay approach** (zero code change):
```
MAIL_HOST=smtp.azurecomm.net
MAIL_PORT=587
MAIL_USERNAME=<ACS-resource-name>.<entra-app-id>.<tenant-id>
MAIL_PASSWORD=<entra-client-secret>
MAIL_FROM=DoNotReply@xxxxxxxx.azurecomm.net
```

---

## Option 4: Mailpit Container (catch-all, no real delivery)

**What**: Deploy Mailpit as a sidecar container in the staging Container App environment. Catches all emails in a web UI without delivering them.

| | |
|---|---|
| **Free tier** | Free (open-source container) |
| **Setup effort** | ~30 min |
| **Domain verification** | None |
| **SDK** | None — existing SMTP code works as-is |
| **Human in the loop** | None |

**Pros**
- **Fully automatable** — no accounts, no DNS, no secrets
- Zero code changes to email service (just point MAIL_HOST to sidecar)
- Web UI to inspect all caught emails (HTML rendering, headers, attachments)
- Perfect for E2E testing — verify email content without real delivery
- No risk of accidentally emailing real users

**Cons**
- Emails are not actually delivered — cannot test real inbox delivery
- Requires an additional container (small resource cost)
- Mailpit web UI needs to be exposed (ingress config) or accessed via port-forward
- Not useful if the goal is to test deliverability to real inboxes

**Can be fully automated (no human)?** **Yes.** Add a Mailpit container to the Bicep template, set `MAIL_HOST` to its internal hostname, and deploy. No accounts, no DNS, no manual steps.

**Bicep addition**:
```bicep
resource mailpit 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'lendq-mailpit-${environmentName}'
  properties: {
    configuration: {
      ingress: { external: true, targetPort: 8025 }  // Web UI
    }
    template: {
      containers: [{
        name: 'mailpit'
        image: 'axllent/mailpit:latest'
        resources: { cpu: json('0.25'), memory: '0.5Gi' }
      }]
    }
  }
}
```

**Env var**: `MAIL_HOST=lendq-mailpit-staging` (internal DNS within Container App Environment)

---

## Option 5: Mailtrap

**What**: Email testing platform with a fake SMTP inbox. Catches emails in a shared inbox with a web UI. Also offers a sending API for real delivery.

| | |
|---|---|
| **Free tier** | 100 test emails/month (inbox), 1,000 emails/month (sending API) |
| **Setup effort** | ~15 min |
| **Domain verification** | None for test inbox; required for sending API |
| **SDK** | None — standard SMTP credentials |
| **Human in the loop** | Account signup only |

**Pros**
- Purpose-built for staging/testing
- SMTP inbox catches emails — great for E2E testing email content
- Also has a real sending mode if needed later
- Team inbox sharing (multiple people can view caught emails)
- Spam score analysis on caught emails

**Cons**
- Free tier is limited (100 test emails/month)
- Third-party account required
- Not real delivery in inbox mode (same limitation as Mailpit)
- Less generous than Mailpit for high-volume test runs

**Can be fully automated (no human)?** No. Account signup is manual. After that, code + deploy is automatable.

**Env vars** (from Mailtrap inbox credentials):
```
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=587
MAIL_USERNAME=<from-mailtrap-dashboard>
MAIL_PASSWORD=<from-mailtrap-dashboard>
```

---

## Comparison Matrix

| Criteria | Resend | Gmail SMTP | Azure ACS | Mailpit | Mailtrap |
|----------|--------|------------|-----------|---------|----------|
| **Real delivery** | Yes | Yes | Yes | No | No (inbox) / Yes (sending) |
| **Free tier** | 100/day | 500/day | 100/day | Unlimited | 100/month |
| **Code changes** | Replace SMTP with SDK | Add 2 lines | None (SMTP relay) or SDK | None | Add 2 lines |
| **DNS/domain work** | Yes (or use test sender) | No | Partial (managed subdomain) | No | No |
| **No human needed** | No | No | No | **Yes** | No |
| **Azure-native** | No | No | **Yes** | Partial (container) | No |
| **Best for** | Real delivery + DX | Quick & dirty | Production path | E2E test verification | Team email testing |
| **Setup time** | 30 min | 15 min | 45 min | 30 min | 15 min |

---

## Recommendation

| Goal | Recommended option |
|------|--------------------|
| **Verify email content in E2E tests (no human)** | **Mailpit** — fully automatable, zero accounts |
| **Quick test with real delivery** | **Gmail SMTP** — fastest setup, needs 1 App Password |
| **Production-ready path** | **Azure ACS** — stays in ecosystem, scales to production |
| **Best developer experience** | **Resend** — cleanest API, best docs, easy to swap later |

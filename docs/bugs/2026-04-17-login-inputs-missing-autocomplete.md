---
id: 2026-04-17-login-inputs-missing-autocomplete
title: Login form inputs missing `autocomplete` attributes
status: open
severity: low
area: frontend
reported_by: claude
reported_at: 2026-04-17
---

## Summary

The email and password inputs on the sign-in page do not declare `autocomplete` hints. Chromium emits a console warning and password managers may fail to offer auto-fill reliably.

## Environment

- Environment: staging (`https://lemon-wave-0a1790b0f.6.azurestaticapps.net/login`)
- Commit / version: `d764f7e`
- Browser / OS: Chromium via `playwright-cli` on Windows 11

## Steps to reproduce

1. Open `https://lemon-wave-0a1790b0f.6.azurestaticapps.net/login`.
2. Open Chromium DevTools → Console.
3. Observe the verbose warning.

## Expected behavior

- Email input declares `autoComplete="email"`.
- Password input declares `autoComplete="current-password"`.
- No browser warning.

This matches WCAG 1.3.5 (Identify Input Purpose) and standard password-manager expectations.

## Actual behavior

Console emits:

```
[VERBOSE] [DOM] Input elements should have autocomplete attributes (suggested: "current-password"):
  (More info: https://goo.gl/9p2vKq)
```

Password managers (1Password, Chrome's built-in, Bitwarden) may fall back to heuristics or skip auto-fill entirely.

## Root cause analysis

`frontend/src/auth/LoginPage.tsx` renders two `<Input />` components for email and password without passing `autoComplete` props. The `Input` wrapper at `frontend/src/ui/Input.tsx` forwards arbitrary props, so the fix is simply to set the attribute at the LoginPage level.

## Suggested fix

Add `autoComplete` props in `frontend/src/auth/LoginPage.tsx`:

- Email input: `autoComplete="email"`
- Password input: `autoComplete="current-password"`

Same treatment applies to `SignUpPage` (`autoComplete="new-password"` for password), `ForgotPasswordPage` (`autoComplete="email"`), and `ResetPasswordPage` (`autoComplete="new-password"`), but the login page is where the browser warning was surfaced and where the regression test will be anchored.

## Impact and workaround

Low. Users can still sign in manually. Password-manager users lose a minor affordance. No data loss or security impact.

## Related

- User guide section: [`docs/user-guide/01-getting-started.md`](../user-guide/01-getting-started.md#4-sign-in)

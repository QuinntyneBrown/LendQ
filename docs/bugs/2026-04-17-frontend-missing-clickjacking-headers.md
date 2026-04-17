---
id: 2026-04-17-frontend-missing-clickjacking-headers
title: Static Web App serves HTML without X-Frame-Options or Content-Security-Policy
status: fixed
severity: medium
area: infra
reported_by: claude
reported_at: 2026-04-17
fixed_at: 2026-04-17
fixed_in: frontend/public/staticwebapp.config.json (globalHeaders with X-Frame-Options: DENY and Content-Security-Policy: frame-ancestors 'none')
---

## Summary

`curl -sI https://lemon-wave-0a1790b0f.6.azurestaticapps.net/` returns `strict-transport-security`, `referrer-policy`, `x-content-type-options`, `x-xss-protection`, and `x-dns-prefetch-control` — but no `X-Frame-Options` and no `Content-Security-Policy`. The LendQ SPA can therefore be iframed by any third-party origin, making it vulnerable to UI-redressing / clickjacking attacks against authenticated sessions.

The backend API at `lendq-api-staging.…azurecontainerapps.io` *does* emit `x-frame-options: DENY` and `content-security-policy: default-src 'self'` (via `backend/app/middleware/security_headers.py`). The frontend origin serves the static HTML directly from Azure Static Web Apps without those headers.

## Environment

- Environment: staging (`https://lemon-wave-0a1790b0f.6.azurestaticapps.net/`)
- Commit / version: `v9e0f4c8`

## Steps to reproduce

```
$ curl -sI https://lemon-wave-0a1790b0f.6.azurestaticapps.net/
HTTP/2 200
strict-transport-security: …
referrer-policy: same-origin
x-content-type-options: nosniff
x-xss-protection: 1; mode=block
x-dns-prefetch-control: off
```

Note the absence of `x-frame-options` and `content-security-policy`.

Compare with the backend:

```
$ curl -sI .../api/v1/health/live
HTTP/2 200
x-frame-options: DENY
content-security-policy: default-src 'self'
…
```

## Expected behavior

`frontend/public/staticwebapp.config.json` should set `globalHeaders` so every HTML response includes at least:

- `X-Frame-Options: DENY` (blocks iframe embedding)
- `Content-Security-Policy: frame-ancestors 'none'` (modern equivalent; also blocks `<embed>` / `<object>`)

A full CSP is a bigger effort (needs to permit Google Fonts, the API origin, inline styles for the app, and whatever the React build emits). Start with clickjacking defence and iterate.

## Actual behavior

An attacker can iframe LendQ into a page they control, paint transparent overlays, and trick an authenticated user into clicking destructive buttons (record payment, change role permissions, delete user).

## Root cause analysis

`frontend/public/staticwebapp.config.json` currently only configures `navigationFallback`. Azure Static Web Apps supports a top-level `globalHeaders` map — it just isn't populated.

## Suggested fix

Update `frontend/public/staticwebapp.config.json`:

```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/assets/*", "/*.ico", "/*.svg", "/*.png", "/*.jpg", "/*.webp"]
  },
  "globalHeaders": {
    "X-Frame-Options": "DENY",
    "Content-Security-Policy": "frame-ancestors 'none'"
  }
}
```

Follow-ups (bigger scope, own tickets): craft a full CSP including `default-src 'self'`, the API origin in `connect-src`, and Google Fonts in `font-src` / `style-src`.

## Impact and workaround

Medium. Clickjacking is a real threat against authenticated lending actions. No user workaround; infra fix.

## Related

- File: `frontend/public/staticwebapp.config.json`
- Backend already defended: `backend/app/middleware/security_headers.py`

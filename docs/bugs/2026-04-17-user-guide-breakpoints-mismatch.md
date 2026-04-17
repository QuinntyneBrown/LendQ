---
id: 2026-04-17-user-guide-breakpoints-mismatch
title: User guide's responsive breakpoints don't match the shipped CSS
status: open
severity: low
area: docs
reported_by: claude
reported_at: 2026-04-17
---

## Summary

`docs/user-guide/03-navigation.md` claims the desktop layout activates at **≥ 1024 px** and tablet spans **768–1023 px**. The actual code in `frontend/src/layout/useBreakpoint.ts` switches to desktop only at **≥ 1280 px**, leaving 768–1279 as tablet. A viewport of 1024 px — a common size — is tablet per the code but desktop per the guide.

Same shape as iter 30's mobile-nav drift: docs stale, code ships correctly.

## Environment

- Environment: staging and local.
- Commit / version: `vb091191`

## Steps to reproduce

```
$ cat frontend/src/layout/useBreakpoint.ts | grep '< 1'
  if (width < 768) return "mobile";
  if (width < 1280) return "tablet";
```

```
$ grep -A 4 "Desktop (" docs/user-guide/03-navigation.md
## Desktop (≥ 1024 px wide)
...
```

Resize a browser to 1024 × 800 and observe the tablet hamburger-drawer layout, not the desktop-with-sidebar layout.

## Expected behavior

The guide should describe:

- Desktop: ≥ 1280 px
- Tablet: 768 – 1279 px
- Mobile: < 768 px

## Actual behavior

Guide reads 1024 as the desktop breakpoint. Anyone sizing their browser to that width while following the guide sees the "tablet" experience despite the doc saying "desktop".

## Root cause analysis

`useBreakpoint.ts` picked 1280 as the desktop cutoff (Tailwind's `xl`). The original guide was written against a 1024 (Tailwind `lg`) cutoff and never updated when the code changed.

## Suggested fix

Update `docs/user-guide/03-navigation.md`:

- `## Desktop (≥ 1024 px wide)` → `## Desktop (≥ 1280 px wide)`
- `## Tablet (768 – 1023 px wide)` → `## Tablet (768 – 1279 px wide)`

## Impact and workaround

Low — docs-only. No functionality impact.

## Related

- File: `docs/user-guide/03-navigation.md`
- Source of truth: `frontend/src/layout/useBreakpoint.ts`
- Sibling: `docs/bugs/2026-04-17-user-guide-mobile-nav-mismatch.md` (same drift class, fixed iter 30)

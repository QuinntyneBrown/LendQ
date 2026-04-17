---
id: 2026-04-17-formatdate-timezone-off-by-one
title: Date-only values render as the previous day for users west of UTC
status: fixed
severity: high
area: frontend
reported_by: claude
reported_at: 2026-04-17
fixed_at: 2026-04-17
fixed_in: frontend/src/utils/format.ts (parseISO instead of new Date)
---

## Summary

`formatDate()` in `frontend/src/utils/format.ts` calls `new Date(d)` on date-only strings like `"2026-05-01"`, which JavaScript parses as UTC midnight. For any user west of UTC, that instant renders as the previous calendar day in local time — so a loan whose DB `start_date` is `2026-05-01` shows up as **Apr 30, 2026** in the UI. This affects every loan page, the dashboard, and every date-only field across the app.

## Environment

- Environment: staging (`https://lemon-wave-0a1790b0f.6.azurestaticapps.net/`)
- Commit / version: footer shows `v83bab93`
- Browser timezone: `America/Toronto` (UTC-4, `getTimezoneOffset() === 240`)
- User role: `creditor@lendq.local`

## Steps to reproduce

1. Sign in as a creditor.
2. Open a loan whose `start_date` ends in `-01` (any first-of-month), for example the test loan created during this audit: `/loans/c6722cf4-dfac-4844-a678-215eeefb55cc` (`start_date: "2026-05-01"` per the API).
3. Observe the **Loan Details** card "Start Date: Apr 30, 2026" and the summary card "Next Payment: Apr 30, 2026".
4. Call the API directly: `GET /api/v1/loans/c6722cf4-…` → `{"start_date": "2026-05-01", …}`.

## Expected behavior

The UI should render `"2026-05-01"` as **May 1, 2026** everywhere — regardless of the viewer's timezone. A date-only value has no time component; there is no UTC-vs-local ambiguity to resolve.

## Actual behavior

UI: **Apr 30, 2026**. API: `"2026-05-01"`. The DB and API are correct; rendering is wrong.

Verified directly from the browser console:

```js
new Date("2026-05-01").toString()
// "Wed Apr 30 2026 20:00:00 GMT-0400 (Eastern Daylight Time)"
```

So `date-fns`'s `format(new Date("2026-05-01"), "MMM d, yyyy")` produces `"Apr 30, 2026"` in Toronto.

## Root cause analysis

`frontend/src/utils/format.ts:12-14`:

```ts
export function formatDate(d: string): string {
  return format(new Date(d), "MMM d, yyyy");
}
```

Per the ECMAScript spec, a string in `YYYY-MM-DD` form is interpreted as UTC midnight. `date-fns`'s `format` then renders that instant in the browser's local timezone, which subtracts the offset and flips the date.

## Suggested fix

Use `parseISO` from `date-fns`, which parses date-only ISO strings as **local** midnight, not UTC:

```ts
import { format, formatDistanceToNow, parseISO } from "date-fns";

export function formatDate(d: string): string {
  return format(parseISO(d), "MMM d, yyyy");
}
```

`parseISO` still handles datetime strings with explicit timezone info correctly, so this does not change behavior for timestamped fields like `created_at`.

## Impact and workaround

High. Every date-only field across the app (loan `start_date`, payment `due_date` when treated as date-only, savings `deadline`, etc.) is wrong by one day for every user in a timezone west of UTC. This includes most North American users, which is the only demographic currently on staging.

No user-side workaround. Backend values are correct; only the UI layer needs the fix.

## Related

- File: `frontend/src/utils/format.ts`
- Widespread callers across `loans/`, `payments/`, `savings/`, `dashboard/`

---
id: 2026-04-17-pagination-params-uncapped
title: List endpoints accept unbounded per_page and silently coerce invalid page values
status: open
severity: medium
area: backend
reported_by: claude
reported_at: 2026-04-17
---

## Summary

Every paginated list endpoint (`/loans`, `/savings`, `/notifications`, `/users`, `/admin/accounts`, …) accepts arbitrary `page` and `per_page` query parameters with no upper bound and no error for invalid values. Specifically:

- `per_page=100000` → 200, response payload advertises `per_page: 100000`. With enough rows in the target table this becomes a DoS vector — one GET request drags back the entire table.
- `per_page=-1` → silently falls back to `per_page: 20`.
- `page=-1` / `page=0` → silently coerced to `page: 1`.

Silent coercion hides genuine bugs in clients; unbounded per_page is a cheap way to exhaust DB, wire, and memory.

## Environment

- Environment: staging (`https://lemon-wave-0a1790b0f.6.azurestaticapps.net/`)
- Commit / version: `v70af8e4`
- User: any authenticated user.

## Steps to reproduce

```
GET /api/v1/loans?per_page=100000
Authorization: Bearer <any-token>
→ 200 { "per_page": 100000, "items": [...], "total": 16, "page": 1 }
```

```
GET /api/v1/loans?page=-1
→ 200 { "page": 1, "items": [...] }

GET /api/v1/loans?per_page=-1
→ 200 { "per_page": 20, "items": [...] }
```

## Expected behavior

Reject at the schema layer:

- `page >= 1` (422 if < 1)
- `1 <= per_page <= 100` (422 otherwise)

The numbers pick a sensible ceiling: a realistic UI never needs more than a few dozen rows per page. Round to 100 for headroom.

## Actual behavior

No validator. Whatever the pagination helper does with out-of-range values leaks into the response metadata.

## Root cause analysis

Each controller parses `page` and `per_page` directly from `request.args` without validation. Pagination is implemented in repository helpers that accept arbitrary integers.

Grep confirms most endpoints follow the same pattern:

```python
page = int(request.args.get("page", 1))
per_page = int(request.args.get("per_page", 20))
```

There's no shared schema or validator.

## Suggested fix

Add a shared `PaginationParamsSchema` (or helper) that:

1. Defaults page=1, per_page=20.
2. Range-validates `page >= 1, per_page in [1, 100]`.
3. Returns 422 with a clear message on violation.

Or simpler as a first pass: replace each controller's `int(request.args.get("page", 1))` pair with a helper `parse_pagination()` that does `max(1, …)` clamping AND caps per_page at 100.

For this session I'll scope the fix to the loans endpoint; other list endpoints should follow in a sweep.

## Impact and workaround

Medium. Defense-in-depth: it's a DoS vector today, worse once the platform has many rows per user. No user-facing correctness issue. No client workaround needed.

## Related

- Controllers to audit: `loan_controller`, `savings_goal_controller`, `notification_controller`, `user_controller`, `admin_bank_account_controller`, `recurring_loan_controller`.

---
id: 2026-04-17-savings-text-fields-allow-html
title: Savings goal name/description accept HTML characters (same as loan description)
status: fixed
severity: low
area: backend
reported_by: claude
reported_at: 2026-04-17
fixed_at: 2026-04-17
fixed_in: backend/app/schemas/text_validators.py (shared module) + savings_goal_schemas.py (applied to name + description on Create and Update) + loan_schemas.py (refactored to use the shared module)
---

## Summary

Savings goals accept `<script>` / `<img>` style text in their `name` and `description` fields. Same data-hygiene class as the loan bug closed in iter 21: React escapes the output so there's no XSS, but the raw HTML wraps ugly in savings list cards and detail headings. The loan-description fix introduced `_PLAIN_TEXT_NO_ANGLE_BRACKETS` — savings was missed.

## Environment

- Environment: staging (`https://lemon-wave-0a1790b0f.6.azurestaticapps.net/`)
- Commit / version: `vbfa4134`

## Steps to reproduce

```
POST /api/v1/savings
{ "name": "<script>alert(1)</script>", "target_amount": 100 }
→ 201 Created, "name": "<script>alert(1)</script>" persisted verbatim
```

## Expected behavior

422 VALIDATION_ERROR on both `name` and `description` fields if they contain `<` or `>`.

## Actual behavior

Accepted.

## Root cause analysis

`backend/app/schemas/savings_goal_schemas.py`:

- `CreateSavingsGoalSchema.name` — `validate.Length(min=1, max=255)` only
- `CreateSavingsGoalSchema.description` — `validate.Length(max=500)` only
- Same on the Update variants

The iter-21 fix introduced `_PLAIN_TEXT_NO_ANGLE_BRACKETS` in `loan_schemas.py`. Savings schema didn't import it.

## Suggested fix

Apply the existing `_PLAIN_TEXT_NO_ANGLE_BRACKETS` validator to `name` and `description` across create + update. Consider promoting the regex to a shared module (`schemas/text_validators.py`) since we're now using it in two places.

## Impact and workaround

Low — data hygiene, not security (React escapes on render, no `dangerouslySetInnerHTML` anywhere). Workaround: edit the goal after the fix lands.

## Related

- Parent: `docs/bugs/2026-04-17-loan-description-allows-html-characters.md` — identical shape, fixed in iter 21.
- File: `backend/app/schemas/savings_goal_schemas.py`

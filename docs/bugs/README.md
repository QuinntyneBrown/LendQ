# Bug Log

This directory is the canonical location for tracking bugs found in LendQ. Each bug lives as a single Markdown file in `docs/bugs/`.

## When to file a bug here

- A defect is found in the code, infrastructure, or behavior of LendQ (any environment: local, staging, production).
- A regression is discovered by tests, users, or during exploratory testing.
- A known issue needs to be recorded for later triage, even if no fix is planned yet.

Internal bug notes live here; externally-visible issues may additionally be mirrored to GitHub Issues.

## File naming

```
docs/bugs/YYYY-MM-DD-short-slug.md
```

- `YYYY-MM-DD` — the date the bug was logged (not the date it was introduced).
- `short-slug` — a few lowercase, hyphen-separated words that identify the bug (e.g. `login-redirects-to-blank-page`).

Examples:

- `2026-04-17-payment-schedule-off-by-one.md`
- `2026-04-17-sse-notifications-disconnect-on-idle.md`

## Required format

Every bug file must include the frontmatter and sections below. Copy [`_template.md`](./_template.md) as a starting point.

### Frontmatter

```yaml
---
id: YYYY-MM-DD-short-slug
title: One-line human-readable title
status: open | investigating | fixed | wont-fix | duplicate
severity: critical | high | medium | low
area: backend | frontend | e2e | infra | docs | other
reported_by: name or handle
reported_at: YYYY-MM-DD
fixed_at: YYYY-MM-DD          # omit until fixed
fixed_in: <commit sha or PR>  # omit until fixed
---
```

### Body sections (in this order)

1. **Summary** — 1–3 sentences describing the bug in plain language.
2. **Environment** — Where it was observed (local, staging, production), browser/OS if relevant, backend/frontend version or commit SHA.
3. **Steps to reproduce** — Numbered list. Include seed data, user role, URLs, payloads.
4. **Expected behavior** — What should have happened.
5. **Actual behavior** — What actually happened. Include error messages, stack traces, screenshots, request/response snippets.
6. **Root cause analysis** — The underlying cause. Cite specific files and line numbers (`file_path:line_number`). If the cause spans multiple layers, describe each. If still unknown, write `Unknown — under investigation` and list what has been ruled out.
7. **Suggested fix** — The proposed change. Be specific: which function, which condition, which config. If multiple options exist, list trade-offs. If the fix is already merged, link the commit/PR and summarize what was changed.
8. **Impact and workaround** — Who is affected, how often, and any temporary mitigation users or operators can apply until the fix ships.
9. **Related** — Links to related bugs, specs, PRs, commits, logs, or dashboards.

Keep sections short and factual. Prefer code blocks and file:line references over prose.

## Lifecycle

1. **open** — Logged, not yet triaged or worked on.
2. **investigating** — Someone is actively looking into root cause.
3. **fixed** — A commit or PR has landed that resolves the bug. Fill in `fixed_at` and `fixed_in`.
4. **wont-fix** — Decision made not to fix. Explain why in the body.
5. **duplicate** — Same as another logged bug. Link it in `Related` and close.

Do not delete bug files once filed — they are a historical record. Move through statuses instead.

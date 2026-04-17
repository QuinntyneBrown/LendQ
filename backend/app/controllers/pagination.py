"""Shared pagination parameter parsing for list endpoints.

Born from docs/bugs/2026-04-17-pagination-params-uncapped.md: list
endpoints previously parsed `page` and `per_page` directly via
`request.args.get(..., type=int)` with no bounds, which meant
`per_page=100000` sailed through as a DoS vector and invalid values
were silently coerced.

Every list endpoint should call `parse_pagination()` instead. The
helper raises ValidationError (→ 422) on out-of-range values rather
than coercing silently — callers who relied on coercion need a
client-side fix.
"""

from __future__ import annotations

from flask import request

from app.errors.exceptions import ValidationError

DEFAULT_PAGE = 1
DEFAULT_PER_PAGE = 20
MIN_PAGE = 1
MIN_PER_PAGE = 1
MAX_PER_PAGE = 100


def parse_pagination() -> tuple[int, int]:
    """Return (page, per_page) after validating the incoming request args.

    Raises:
        ValidationError: When page < 1 or per_page is outside [1, 100].
    """
    page_raw = request.args.get("page", DEFAULT_PAGE)
    per_page_raw = request.args.get("per_page", DEFAULT_PER_PAGE)

    try:
        page = int(page_raw)
    except (TypeError, ValueError) as exc:
        raise ValidationError("page must be an integer") from exc

    try:
        per_page = int(per_page_raw)
    except (TypeError, ValueError) as exc:
        raise ValidationError("per_page must be an integer") from exc

    if page < MIN_PAGE:
        raise ValidationError(f"page must be >= {MIN_PAGE}")
    if per_page < MIN_PER_PAGE or per_page > MAX_PER_PAGE:
        raise ValidationError(
            f"per_page must be between {MIN_PER_PAGE} and {MAX_PER_PAGE}"
        )

    return page, per_page

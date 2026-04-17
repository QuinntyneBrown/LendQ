"""Shared date-validation helpers used across services.

Born out of the past-date validation audit in 2026-04-17:

- 2026-04-17-reschedule-accepts-past-dates
- 2026-04-17-create-loan-accepts-past-start-date
- 2026-04-17-savings-goal-accepts-past-deadline
- 2026-04-17-recurring-loan-past-start-date
- 2026-04-17-recurring-deposit-past-start-date

Five services each grew a hand-rolled `if value < date.today(): raise
ValidationError(...)` guard. This module centralises the check so future
additions pick up the right error text and so any policy change (e.g.
"allow yesterday to account for timezone drift") happens in one place.
"""

from __future__ import annotations

from datetime import date

from app.errors.exceptions import ValidationError


def reject_past_date(value: date | None, field_label: str = "Date") -> None:
    """Raise ValidationError if `value` is strictly before today.

    `None` is treated as "no date supplied" and is a no-op, so callers with
    optional fields (like savings goal deadlines) can use this helper
    without a wrapping `if` — they still need to omit the call entirely
    when the field is unconditionally required.

    Args:
        value: The date to check, or None to skip.
        field_label: Human-readable name for the field, used in the error
            message. Examples: "Start date", "Deadline", "New payment date".
    """
    if value is None:
        return
    if value < date.today():
        raise ValidationError(f"{field_label} cannot be in the past")

"""Shared text-field validators used across multiple schemas.

Born out of iter-21 and iter-28 data-hygiene fixes: both loan descriptions
and savings goal names/descriptions were accepting HTML-looking strings
that rendered as raw text in headings and list cards. React escapes on
render (no XSS), but the data is dirty and the UI wraps awkwardly.

Keeping the validator here so future schemas only have to import it rather
than re-type the regex — drift vector we hit once already.
"""

from marshmallow import validate


PLAIN_TEXT_NO_ANGLE_BRACKETS = validate.Regexp(
    r"^[^<>]*$",
    error="cannot contain < or > characters",
)

"""Unit tests for the shared parse_pagination helper."""

import pytest

from app.controllers.pagination import (
    MAX_PER_PAGE,
    MIN_PAGE,
    MIN_PER_PAGE,
    parse_pagination,
)
from app.errors.exceptions import ValidationError


@pytest.fixture
def req_ctx(app):
    """Make a request context we can poke `?page=` etc. into."""
    def _make(query_string: str = ""):
        return app.test_request_context(path=f"/?{query_string}")
    return _make


class TestParsePagination:
    def test_defaults(self, req_ctx):
        with req_ctx():
            assert parse_pagination() == (1, 20)

    def test_valid_values(self, req_ctx):
        with req_ctx("page=3&per_page=50"):
            assert parse_pagination() == (3, 50)

    def test_page_at_minimum(self, req_ctx):
        with req_ctx(f"page={MIN_PAGE}"):
            page, _ = parse_pagination()
            assert page == MIN_PAGE

    def test_per_page_at_maximum(self, req_ctx):
        with req_ctx(f"per_page={MAX_PER_PAGE}"):
            _, per_page = parse_pagination()
            assert per_page == MAX_PER_PAGE

    def test_page_zero_rejected(self, req_ctx):
        with req_ctx("page=0"), pytest.raises(ValidationError):
            parse_pagination()

    def test_page_negative_rejected(self, req_ctx):
        with req_ctx("page=-1"), pytest.raises(ValidationError):
            parse_pagination()

    def test_per_page_zero_rejected(self, req_ctx):
        with req_ctx("per_page=0"), pytest.raises(ValidationError):
            parse_pagination()

    def test_per_page_over_max_rejected(self, req_ctx):
        with req_ctx(f"per_page={MAX_PER_PAGE + 1}"), pytest.raises(ValidationError):
            parse_pagination()

    def test_per_page_huge_rejected(self, req_ctx):
        """Regression — bug 2026-04-17-pagination-params-uncapped."""
        with req_ctx("per_page=100000"), pytest.raises(ValidationError):
            parse_pagination()

    def test_non_integer_rejected(self, req_ctx):
        with req_ctx("page=abc"), pytest.raises(ValidationError):
            parse_pagination()

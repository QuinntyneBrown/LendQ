"""Unit tests for the date_validators helpers."""

from datetime import date, timedelta

import pytest

from app.errors.exceptions import ValidationError
from app.services.date_validators import reject_future_date, reject_past_date


class TestRejectPastDate:
    def test_accepts_today(self):
        reject_past_date(date.today())

    def test_accepts_future(self):
        reject_past_date(date.today() + timedelta(days=1))

    def test_accepts_none(self):
        """Optional fields pass None. Must not raise."""
        reject_past_date(None)

    def test_rejects_yesterday(self):
        with pytest.raises(ValidationError) as exc_info:
            reject_past_date(date.today() - timedelta(days=1))
        assert "past" in str(exc_info.value).lower()

    def test_rejects_far_past(self):
        with pytest.raises(ValidationError):
            reject_past_date(date(2010, 1, 1))

    def test_uses_field_label_in_error(self):
        with pytest.raises(ValidationError) as exc_info:
            reject_past_date(date(2010, 1, 1), field_label="Deadline")
        assert "Deadline" in str(exc_info.value)

    def test_default_label(self):
        with pytest.raises(ValidationError) as exc_info:
            reject_past_date(date(2010, 1, 1))
        # Default label is "Date".
        assert "Date" in str(exc_info.value)


class TestRejectFutureDate:
    def test_accepts_today(self):
        reject_future_date(date.today())

    def test_accepts_past(self):
        reject_future_date(date.today() - timedelta(days=1))

    def test_accepts_none(self):
        reject_future_date(None)

    def test_rejects_tomorrow(self):
        with pytest.raises(ValidationError) as exc_info:
            reject_future_date(date.today() + timedelta(days=1))
        assert "future" in str(exc_info.value).lower()

    def test_rejects_far_future(self):
        with pytest.raises(ValidationError):
            reject_future_date(date(2099, 1, 1))

    def test_uses_field_label_in_error(self):
        with pytest.raises(ValidationError) as exc_info:
            reject_future_date(date(2099, 1, 1), field_label="Paid date")
        assert "Paid date" in str(exc_info.value)

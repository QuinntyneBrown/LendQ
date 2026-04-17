from decimal import Decimal

from marshmallow import Schema, fields, validate

from app.schemas.loan_schemas import MONEY_MAX


class PaymentSchema(Schema):
    id = fields.String(dump_only=True)
    loan_id = fields.String()
    amount_due = fields.Decimal(as_string=True)
    amount_paid = fields.Decimal(as_string=True)
    due_date = fields.Date()
    paid_date = fields.Date()
    original_due_date = fields.Date()
    status = fields.String()
    notes = fields.String()
    created_at = fields.DateTime(dump_only=True)


class RecordPaymentRequestSchema(Schema):
    # See docs/bugs/2026-04-17-decimal-amounts-unbounded.md. Upper bound
    # rejects DoS-shaped inputs at the schema edge.
    amount = fields.Decimal(
        required=True,
        as_string=True,
        validate=validate.Range(min=Decimal("0.01"), max=MONEY_MAX),
    )
    paid_date = fields.Date(required=True)
    notes = fields.String(validate=validate.Length(max=2000))


class RescheduleRequestSchema(Schema):
    new_date = fields.Date(required=True)
    reason = fields.String(validate=validate.Length(max=500))


class PauseRequestSchema(Schema):
    payment_ids = fields.List(fields.String(), required=True, validate=validate.Length(min=1))
    reason = fields.String(validate=validate.Length(max=500))

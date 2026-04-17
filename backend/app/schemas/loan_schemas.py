from decimal import Decimal

from marshmallow import Schema, fields, validate

from app.schemas.text_validators import PLAIN_TEXT_NO_ANGLE_BRACKETS


class LoanSchema(Schema):
    id = fields.String(dump_only=True)
    creditor_id = fields.String()
    borrower_id = fields.String()
    description = fields.String()
    principal = fields.Decimal(as_string=True)
    interest_rate = fields.Decimal(as_string=True)
    repayment_frequency = fields.String()
    start_date = fields.Date()
    status = fields.String()
    notes = fields.String()
    outstanding_balance = fields.Method("get_outstanding_balance")
    total_paid = fields.Method("get_total_paid")
    creditor_name = fields.Method("get_creditor_name")
    borrower_name = fields.Method("get_borrower_name")
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    def get_outstanding_balance(self, obj):
        from app.services.balance_service import BalanceService
        return str(BalanceService().get_outstanding_balance(obj.id))

    def get_total_paid(self, obj):
        from app.services.balance_service import BalanceService
        return str(BalanceService().get_total_paid(obj.id))

    def get_creditor_name(self, obj):
        return obj.creditor.name if obj.creditor else None

    def get_borrower_name(self, obj):
        return obj.borrower.name if obj.borrower else None


# Upper bound for money fields. Keeps DB Numeric columns from overflowing
# and rejects obviously-bogus inputs at the API edge. A private-lending
# platform never needs more than a billion-dollar transaction; ~10^9 is
# generous headroom. See docs/bugs/2026-04-17-decimal-amounts-unbounded.md.
MONEY_MAX = Decimal("999999999.99")


class CreateLoanRequestSchema(Schema):
    borrower_id = fields.String(required=True)
    # Angle-bracket rejection keeps HTML-looking text out of headings/lists.
    # React already escapes on render, so this is data hygiene, not XSS
    # defence — see docs/bugs/2026-04-17-loan-description-allows-html-characters.md.
    description = fields.String(
        required=True,
        validate=[
            validate.Length(min=1, max=500),
            PLAIN_TEXT_NO_ANGLE_BRACKETS,
        ],
    )
    principal = fields.Decimal(
        required=True,
        as_string=True,
        validate=validate.Range(min=Decimal("0.01"), max=MONEY_MAX),
    )
    # User guide 04-loans.md promises interest_rate ∈ [0, 100]. Without this
    # bound, negative rates were silently accepted and absurd rates crashed
    # the schedule arithmetic — see
    # docs/bugs/2026-04-17-interest-rate-no-bounds.md.
    interest_rate = fields.Decimal(
        load_default="0.00",
        as_string=True,
        validate=validate.Range(min=Decimal("0"), max=Decimal("100")),
    )
    repayment_frequency = fields.String(
        required=True,
        validate=validate.OneOf(["WEEKLY", "BIWEEKLY", "MONTHLY", "CUSTOM"]),
    )
    # Upper bound keeps the schedule generator from crashing on absurd
    # inputs — see docs/bugs/2026-04-17-num-payments-unbounded.md.
    # 1000 monthly installments ≈ 83 years, far past any realistic loan.
    num_payments = fields.Integer(
        required=True, validate=validate.Range(min=1, max=1000)
    )
    start_date = fields.Date(required=True)
    notes = fields.String(
        validate=[
            validate.Length(max=2000),
            PLAIN_TEXT_NO_ANGLE_BRACKETS,
        ],
    )


class UpdateLoanRequestSchema(Schema):
    description = fields.String(
        validate=[
            validate.Length(min=1, max=500),
            PLAIN_TEXT_NO_ANGLE_BRACKETS,
        ],
    )
    principal = fields.Decimal(
        as_string=True,
        validate=validate.Range(min=Decimal("0.01"), max=MONEY_MAX),
    )
    interest_rate = fields.Decimal(
        as_string=True,
        validate=validate.Range(min=Decimal("0"), max=Decimal("100")),
    )
    repayment_frequency = fields.String(
        validate=validate.OneOf(["WEEKLY", "BIWEEKLY", "MONTHLY", "CUSTOM"])
    )
    start_date = fields.Date()
    status = fields.String(
        validate=validate.OneOf(["ACTIVE", "PAUSED", "OVERDUE", "PAID_OFF", "DEFAULTED"])
    )
    notes = fields.String(
        validate=[
            validate.Length(max=2000),
            PLAIN_TEXT_NO_ANGLE_BRACKETS,
        ],
    )

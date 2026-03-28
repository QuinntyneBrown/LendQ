from marshmallow import Schema, fields, validate


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
    creditor_name = fields.Method("get_creditor_name")
    borrower_name = fields.Method("get_borrower_name")
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    def get_creditor_name(self, obj):
        return obj.creditor.name if obj.creditor else None

    def get_borrower_name(self, obj):
        return obj.borrower.name if obj.borrower else None


class CreateLoanRequestSchema(Schema):
    borrower_id = fields.String(required=True)
    description = fields.String(
        required=True, validate=validate.Length(min=1, max=500)
    )
    principal = fields.Decimal(required=True, as_string=True)
    interest_rate = fields.Decimal(load_default="0.00", as_string=True)
    repayment_frequency = fields.String(
        required=True,
        validate=validate.OneOf(["weekly", "biweekly", "monthly", "custom"]),
    )
    num_payments = fields.Integer(required=True, validate=validate.Range(min=1))
    start_date = fields.Date(required=True)
    notes = fields.String(validate=validate.Length(max=2000))


class UpdateLoanRequestSchema(Schema):
    description = fields.String(validate=validate.Length(min=1, max=500))
    principal = fields.Decimal(as_string=True)
    interest_rate = fields.Decimal(as_string=True)
    repayment_frequency = fields.String(
        validate=validate.OneOf(["weekly", "biweekly", "monthly", "custom"])
    )
    start_date = fields.Date()
    status = fields.String(
        validate=validate.OneOf(["ACTIVE", "PAUSED", "OVERDUE", "PAID_OFF", "DEFAULTED"])
    )
    notes = fields.String(validate=validate.Length(max=2000))

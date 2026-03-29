from decimal import Decimal

from marshmallow import Schema, fields, validate


class SavingsGoalSchema(Schema):
    id = fields.String(dump_only=True)
    user_id = fields.String(dump_only=True)
    name = fields.String()
    target_amount = fields.Decimal(as_string=True)
    current_amount = fields.Decimal(as_string=True)
    currency = fields.String()
    deadline = fields.Date()
    description = fields.String()
    status = fields.String()
    version = fields.Integer()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    progress_percent = fields.Method("get_progress_percent")

    def get_progress_percent(self, obj):
        target = obj.target_amount
        current = obj.current_amount
        if not target or target == 0:
            return "0.0"
        percent = (Decimal(str(current)) / Decimal(str(target))) * 100
        return str(round(percent, 1))


class CreateSavingsGoalSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=1, max=255))
    target_amount = fields.Decimal(required=True, as_string=True, validate=validate.Range(min=Decimal("0.01")))
    currency = fields.String(load_default="USD")
    deadline = fields.Date(load_default=None)
    description = fields.String(load_default=None, validate=validate.Length(max=500))


class UpdateSavingsGoalSchema(Schema):
    name = fields.String(validate=validate.Length(min=1, max=255))
    target_amount = fields.Decimal(as_string=True, validate=validate.Range(min=Decimal("0.01")))
    deadline = fields.Date()
    description = fields.String(validate=validate.Length(max=500))
    expected_version = fields.Integer(required=True)


class ContributeSchema(Schema):
    amount = fields.Decimal(required=True, as_string=True, validate=validate.Range(min=Decimal("0.01")))
    account_id = fields.String(required=True)


class ReleaseSchema(Schema):
    amount = fields.Decimal(required=True, as_string=True, validate=validate.Range(min=Decimal("0.01")))
    account_id = fields.String(required=True)


class SavingsGoalEntrySchema(Schema):
    id = fields.String(dump_only=True)
    goal_id = fields.String()
    direction = fields.String()
    entry_type = fields.String()
    amount = fields.Decimal(as_string=True)
    bank_transaction_id = fields.String()
    running_total = fields.Decimal(as_string=True)
    created_at = fields.DateTime(dump_only=True)

from marshmallow import Schema, fields, validate


class BankAccountSchema(Schema):
    id = fields.String(dump_only=True)
    user_id = fields.String(dump_only=True)
    currency = fields.String()
    current_balance = fields.Decimal(as_string=True)
    status = fields.String()
    timezone = fields.String()
    version = fields.Integer(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    user_name = fields.Method("get_user_name")

    def get_user_name(self, obj):
        return obj.user.name if obj.user else None


class DepositRequestSchema(Schema):
    amount = fields.Decimal(required=True, as_string=True, validate=validate.Range(min=0.01))
    reason_code = fields.String(required=True, validate=validate.Length(min=1, max=50))
    description = fields.String(validate=validate.Length(max=500))


class WithdrawRequestSchema(Schema):
    amount = fields.Decimal(required=True, as_string=True, validate=validate.Range(min=0.01))
    reason_code = fields.String(required=True, validate=validate.Length(min=1, max=50))
    description = fields.String(validate=validate.Length(max=500))


class BankTransactionSchema(Schema):
    id = fields.String(dump_only=True)
    account_id = fields.String()
    direction = fields.String()
    entry_type = fields.String()
    amount = fields.Decimal(as_string=True)
    balance_before = fields.Decimal(as_string=True)
    balance_after = fields.Decimal(as_string=True)
    reason_code = fields.String()
    initiated_by_user_id = fields.String()
    description = fields.String()
    correlation_id = fields.String()
    created_at = fields.DateTime()


class CreateRecurringDepositSchema(Schema):
    amount = fields.Decimal(required=True, as_string=True, validate=validate.Range(min=0.01))
    source_description = fields.String(required=True, validate=validate.Length(min=1, max=255))
    frequency = fields.String(required=True, validate=validate.OneOf(["WEEKLY", "BIWEEKLY", "MONTHLY"]))
    start_date = fields.Date(required=True)
    end_date = fields.Date(load_default=None)
    execution_time_local = fields.String(load_default="09:00")
    timezone = fields.String(load_default="UTC")


class UpdateRecurringDepositSchema(Schema):
    amount = fields.Decimal(as_string=True, validate=validate.Range(min=0.01))
    source_description = fields.String(validate=validate.Length(min=1, max=255))
    frequency = fields.String(validate=validate.OneOf(["WEEKLY", "BIWEEKLY", "MONTHLY"]))
    end_date = fields.Date()
    execution_time_local = fields.String()
    timezone = fields.String()
    expected_version = fields.Integer(required=True)


class RecurringDepositSchema(Schema):
    id = fields.String(dump_only=True)
    account_id = fields.String()
    owner_user_id = fields.String()
    amount = fields.Decimal(as_string=True)
    source_description = fields.String()
    frequency = fields.String()
    start_date = fields.Date()
    end_date = fields.Date()
    execution_time_local = fields.String()
    timezone = fields.String()
    status = fields.String()
    next_execution_at = fields.DateTime()
    last_failure_code = fields.String()
    version = fields.Integer()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()

from marshmallow import Schema, fields, validate


class RecurringLoanSchema(Schema):
    id = fields.String(dump_only=True)
    creditor_id = fields.String()
    borrower_id = fields.String()
    recurrence_interval = fields.String()
    start_date = fields.Date()
    end_date = fields.Date()
    max_occurrences = fields.Integer()
    status = fields.String()
    active_template_version_id = fields.String()
    total_generated = fields.Integer()
    next_generation_at = fields.DateTime()
    last_failure_code = fields.String()
    version = fields.Integer()
    creditor_name = fields.Method("get_creditor_name")
    borrower_name = fields.Method("get_borrower_name")
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    def get_creditor_name(self, obj):
        return obj.creditor.name if obj.creditor else None

    def get_borrower_name(self, obj):
        return obj.borrower.name if obj.borrower else None


class CreateRecurringLoanSchema(Schema):
    borrower_id = fields.String(required=True)
    description_template = fields.String(
        required=True, validate=validate.Length(min=1, max=500)
    )
    principal_amount = fields.Decimal(required=True, as_string=True)
    currency = fields.String(load_default="USD", validate=validate.Length(equal=3))
    interest_rate_percent = fields.Decimal(as_string=True)
    repayment_frequency = fields.String(
        required=True,
        validate=validate.OneOf(["WEEKLY", "BIWEEKLY", "MONTHLY"]),
    )
    installment_count = fields.Integer(
        required=True, validate=validate.Range(min=1)
    )
    recurrence_interval = fields.String(
        required=True,
        validate=validate.OneOf(["WEEKLY", "BIWEEKLY", "MONTHLY"]),
    )
    start_date = fields.Date(required=True)
    end_date = fields.Date()
    max_occurrences = fields.Integer(validate=validate.Range(min=1))
    timezone = fields.String(load_default="UTC")
    allow_parallel_active_generated_loans = fields.Boolean(load_default=False)
    max_generated_loan_principal_exposure = fields.Decimal(as_string=True)


class UpdateRecurringLoanSchema(Schema):
    expected_version = fields.Integer(required=True)
    borrower_id = fields.String()
    description_template = fields.String(validate=validate.Length(min=1, max=500))
    principal_amount = fields.Decimal(as_string=True)
    currency = fields.String(validate=validate.Length(equal=3))
    interest_rate_percent = fields.Decimal(as_string=True)
    repayment_frequency = fields.String(
        validate=validate.OneOf(["WEEKLY", "BIWEEKLY", "MONTHLY"]),
    )
    installment_count = fields.Integer(validate=validate.Range(min=1))
    recurrence_interval = fields.String(
        validate=validate.OneOf(["WEEKLY", "BIWEEKLY", "MONTHLY"]),
    )
    start_date = fields.Date()
    end_date = fields.Date()
    max_occurrences = fields.Integer(validate=validate.Range(min=1))
    timezone = fields.String()
    allow_parallel_active_generated_loans = fields.Boolean()
    max_generated_loan_principal_exposure = fields.Decimal(as_string=True)


class RecurringLoanTemplateVersionSchema(Schema):
    id = fields.String(dump_only=True)
    recurring_loan_id = fields.String()
    version_number = fields.Integer()
    description_template = fields.String()
    principal_amount = fields.Decimal(as_string=True)
    currency = fields.String()
    interest_rate_percent = fields.Decimal(as_string=True)
    repayment_frequency = fields.String()
    installment_count = fields.Integer()
    timezone = fields.String()
    allow_parallel_active_generated_loans = fields.Boolean()
    max_generated_loan_principal_exposure = fields.Decimal(as_string=True)
    created_at = fields.DateTime(dump_only=True)


class RecurringLoanConsentSchema(Schema):
    id = fields.String(dump_only=True)
    recurring_loan_id = fields.String()
    template_version_id = fields.String()
    decision = fields.String()
    decided_by_user_id = fields.String()
    decided_at = fields.DateTime()
    created_at = fields.DateTime(dump_only=True)


class GeneratedLoanRecordSchema(Schema):
    id = fields.String(dump_only=True)
    recurring_loan_id = fields.String()
    loan_id = fields.String()
    template_version_id = fields.String()
    scheduled_for_date = fields.Date()
    sequence = fields.Integer()
    generated_at = fields.DateTime()

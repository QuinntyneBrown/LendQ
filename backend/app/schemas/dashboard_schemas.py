from marshmallow import Schema, fields


class DashboardSummarySchema(Schema):
    total_lent_out = fields.Decimal(as_string=True)
    total_owed = fields.Decimal(as_string=True)
    upcoming_payments_7d = fields.Integer()
    overdue_payments = fields.Integer()


class DashboardLoanSchema(Schema):
    id = fields.String()
    person_name = fields.String()
    principal = fields.Decimal(as_string=True)
    amount = fields.Decimal(as_string=True)
    outstanding_balance = fields.Decimal(as_string=True)
    next_due = fields.String()
    status = fields.String()


class ActivityItemSchema(Schema):
    id = fields.String()
    event_type = fields.String()
    description = fields.String()
    loan_id = fields.String()
    timestamp = fields.DateTime()


class DashboardSchema(Schema):
    summary = fields.Nested(DashboardSummarySchema)
    loans = fields.Nested(DashboardLoanSchema, many=True)
    activity = fields.Nested(ActivityItemSchema, many=True)

from marshmallow import Schema, fields, validate


class LoginRequestSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate.Length(min=1))


class SignUpRequestSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=1, max=255))
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate.Length(min=8))
    confirm_password = fields.String(required=True)


class ForgotPasswordRequestSchema(Schema):
    email = fields.Email(required=True)


class ResetPasswordRequestSchema(Schema):
    token = fields.String(required=True)
    password = fields.String(required=True, validate=validate.Length(min=8))
    confirm_password = fields.String(required=True)


class EmailVerificationConfirmSchema(Schema):
    token = fields.String(required=True)


class EmailVerificationResendSchema(Schema):
    email = fields.Email(required=True)


class TokenResponseSchema(Schema):
    access_token = fields.String()
    expires_in_seconds = fields.Integer()
    csrf_token = fields.String()
    user = fields.Dict()


class SessionResponseSchema(Schema):
    id = fields.String()
    created_at = fields.DateTime()
    last_seen_at = fields.DateTime()
    user_agent = fields.String()
    ip_address = fields.String()
    is_current = fields.Boolean()

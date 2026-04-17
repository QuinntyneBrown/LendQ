from marshmallow import Schema, fields, validate


# Minimum-viable password strength: length + at least one letter + at least
# one digit. Implicitly rejects whitespace-only, all-letter, and all-digit
# passwords like "password" and "12345678". See
# docs/bugs/2026-04-17-weak-password-accepted.md. Upper bound prevents the
# hash function from being fed a DoS-sized string.
_PASSWORD_VALIDATORS = [
    validate.Length(min=8, max=128),
    validate.Regexp(
        r"^(?=.*[A-Za-z])(?=.*\d).+$",
        error="Password must contain at least one letter and one digit",
    ),
]


class LoginRequestSchema(Schema):
    email = fields.Email(required=True)
    # Login allows any non-empty password — users who set weak passwords
    # before the tightening still need to be able to sign in.
    password = fields.String(required=True, validate=validate.Length(min=1))


class SignUpRequestSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=1, max=255))
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=_PASSWORD_VALIDATORS)
    confirm_password = fields.String(required=True)


class ForgotPasswordRequestSchema(Schema):
    email = fields.Email(required=True)


class ResetPasswordRequestSchema(Schema):
    token = fields.String(required=True)
    password = fields.String(required=True, validate=_PASSWORD_VALIDATORS)
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

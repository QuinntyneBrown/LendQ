from marshmallow import Schema, fields, validate


class RoleNestedSchema(Schema):
    id = fields.String()
    name = fields.String()


class UserSchema(Schema):
    id = fields.String(dump_only=True)
    name = fields.String()
    email = fields.Email()
    is_active = fields.Boolean()
    roles = fields.Nested(RoleNestedSchema, many=True, dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class CreateUserRequestSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=1, max=255))
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate.Length(min=8))
    role_ids = fields.List(fields.String(), load_default=[])


class UpdateUserRequestSchema(Schema):
    name = fields.String(validate=validate.Length(min=1, max=255))
    email = fields.Email()
    is_active = fields.Boolean()
    role_ids = fields.List(fields.String())

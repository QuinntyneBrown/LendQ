from marshmallow import Schema, fields


class RoleSchema(Schema):
    id = fields.String(dump_only=True)
    name = fields.String()
    description = fields.String()
    permissions = fields.List(fields.String())


class PermissionUpdateRequestSchema(Schema):
    permissions = fields.List(fields.String(), required=True)

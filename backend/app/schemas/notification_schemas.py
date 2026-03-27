from marshmallow import Schema, fields


class NotificationSchema(Schema):
    id = fields.String(dump_only=True)
    user_id = fields.String()
    type = fields.String()
    message = fields.String()
    loan_id = fields.String()
    is_read = fields.Boolean()
    created_at = fields.DateTime(dump_only=True)


class ChangeLogSchema(Schema):
    id = fields.String()
    entity_type = fields.String()
    entity_id = fields.String()
    field_name = fields.String()
    old_value = fields.String()
    new_value = fields.String()
    changed_by = fields.String()
    changed_at = fields.DateTime()
    reason = fields.String()
    actor_name = fields.Method("get_actor_name")

    def get_actor_name(self, obj):
        return obj.actor.name if obj.actor else None

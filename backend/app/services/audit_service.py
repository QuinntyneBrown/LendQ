from flask import g

from app.extensions import db
from app.models.audit_log import AuditLog


class AuditService:
    def log(self, action, target_type, target_id, actor_id=None,
            before_value=None, after_value=None):
        if actor_id is None:
            user = getattr(g, "current_user", None)
            actor_id = user.id if user else None

        request_id = getattr(g, "request_id", None)

        entry = AuditLog(
            actor_id=actor_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            before_value=before_value,
            after_value=after_value,
            request_id=request_id,
        )
        db.session.add(entry)
        db.session.flush()
        return entry

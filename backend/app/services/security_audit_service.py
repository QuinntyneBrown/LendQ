from flask import g, request

from app.extensions import db
from app.models.security_audit_event import SecurityAuditEvent


class SecurityAuditService:
    def log_event(self, action, outcome, user_id=None,
                  before_values=None, after_values=None):
        if user_id is None:
            user = getattr(g, "current_user", None)
            user_id = user.id if user else None

        ip_address = None
        try:
            ip_address = request.remote_addr
        except RuntimeError:
            pass

        event = SecurityAuditEvent(
            user_id=user_id,
            action=action,
            outcome=outcome,
            request_id=getattr(g, "request_id", None),
            ip_address=ip_address,
            before_values=before_values,
            after_values=after_values,
        )
        db.session.add(event)
        db.session.flush()
        return event

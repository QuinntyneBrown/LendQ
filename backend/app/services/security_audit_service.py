from __future__ import annotations

from flask import g, request

from app.extensions import db
from app.models.security_audit_event import SecurityAuditEvent


class SecurityAuditService:
    def log_event(
        self,
        action: str,
        outcome: str,
        user_id: str | None = None,
        before_values: dict | None = None,
        after_values: dict | None = None,
    ) -> SecurityAuditEvent:
        """Record a security audit event.

        Args:
            action: The security action (e.g. LOGIN, SIGNUP, LOGOUT).
            outcome: The outcome (e.g. SUCCESS, FAILURE, NOT_FOUND).
            user_id: The ID of the user involved. Defaults to the current request user.
            before_values: Optional state snapshot before the action.
            after_values: Optional state snapshot after the action.

        Returns:
            The created SecurityAuditEvent instance.
        """
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

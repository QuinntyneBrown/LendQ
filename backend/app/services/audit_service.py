from __future__ import annotations

from flask import g

from app.extensions import db
from app.models.audit_log import AuditLog


class AuditService:
    def log(
        self,
        action: str,
        target_type: str,
        target_id: str,
        actor_id: str | None = None,
        before_value: dict | None = None,
        after_value: dict | None = None,
    ) -> AuditLog:
        """Record an audit log entry for a domain action.

        Args:
            action: The action performed (e.g. CREATE, UPDATE, DEACTIVATE).
            target_type: The entity type being acted on (e.g. User, Loan).
            target_id: The ID of the target entity.
            actor_id: The ID of the acting user. Defaults to the current request user.
            before_value: Optional snapshot of the entity state before the action.
            after_value: Optional snapshot of the entity state after the action.

        Returns:
            The created AuditLog entry.
        """
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

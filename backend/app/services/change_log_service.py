from __future__ import annotations

from app.extensions import db
from app.models.change_log import ChangeLog


class ChangeLogService:
    def log_change(
        self,
        entity_type: str,
        entity_id: str,
        field_name: str,
        old_value: str | None,
        new_value: str | None,
        changed_by: str | None = None,
        reason: str | None = None,
    ) -> ChangeLog:
        """Record a field-level change for an entity.

        Args:
            entity_type: The type of entity changed (e.g. Loan, Payment).
            entity_id: The ID of the changed entity.
            field_name: The name of the field that changed.
            old_value: The previous value (as string), or None.
            new_value: The new value (as string), or None.
            changed_by: The ID of the user who made the change.
            reason: Optional reason for the change.

        Returns:
            The created ChangeLog entry.
        """
        entry = ChangeLog(
            entity_type=entity_type,
            entity_id=entity_id,
            field_name=field_name,
            old_value=str(old_value) if old_value is not None else None,
            new_value=str(new_value) if new_value is not None else None,
            changed_by=changed_by,
            reason=reason,
        )
        db.session.add(entry)
        db.session.flush()
        return entry

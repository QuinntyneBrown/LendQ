from app.extensions import db
from app.models.change_log import ChangeLog


class ChangeLogService:
    def log_change(self, entity_type, entity_id, field_name, old_value, new_value,
                   changed_by=None, reason=None):
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

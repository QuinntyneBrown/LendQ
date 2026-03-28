import uuid
from datetime import datetime, timezone

from app.extensions import db


class ChangeLog(db.Model):
    __tablename__ = "change_logs"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    entity_type = db.Column(db.String(50), nullable=False, index=True)
    entity_id = db.Column(db.String(36), nullable=False, index=True)
    field_name = db.Column(db.String(100), nullable=False)
    old_value = db.Column(db.Text)
    new_value = db.Column(db.Text)
    changed_by = db.Column(db.String(36), db.ForeignKey("users.id"))
    changed_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    reason = db.Column(db.Text)

    actor = db.relationship("User", foreign_keys=[changed_by])

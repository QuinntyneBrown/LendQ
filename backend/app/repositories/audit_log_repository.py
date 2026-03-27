from app.models.audit_log import AuditLog
from app.repositories.base import BaseRepository


class AuditLogRepository(BaseRepository):
    model = AuditLog

    def get_by_target(self, target_type, target_id, page=1, per_page=20):
        return self.get_paginated(
            page=page,
            per_page=per_page,
            filters=[
                AuditLog.target_type == target_type,
                AuditLog.target_id == target_id,
            ],
            order_by=AuditLog.timestamp.desc(),
        )

    def get_by_actor(self, actor_id, page=1, per_page=20):
        return self.get_paginated(
            page=page,
            per_page=per_page,
            filters=[AuditLog.actor_id == actor_id],
            order_by=AuditLog.timestamp.desc(),
        )

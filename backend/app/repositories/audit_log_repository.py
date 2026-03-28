from __future__ import annotations

from app.models.audit_log import AuditLog
from app.repositories.base import BaseRepository


class AuditLogRepository(BaseRepository):
    model = AuditLog

    def get_by_target(
        self,
        target_type: str,
        target_id: str,
        page: int = 1,
        per_page: int = 20,
    ) -> dict:
        """Return paginated audit logs for a specific target entity.

        Args:
            target_type: The entity type (e.g. ``"Loan"``).
            target_id: The target entity's ID.
            page: The page number (1-indexed).
            per_page: Number of items per page.

        Returns:
            A paginated dict of audit log entries.
        """
        return self.get_paginated(
            page=page,
            per_page=per_page,
            filters=[
                AuditLog.target_type == target_type,
                AuditLog.target_id == target_id,
            ],
            order_by=AuditLog.timestamp.desc(),
        )

    def get_by_actor(self, actor_id: str, page: int = 1, per_page: int = 20) -> dict:
        """Return paginated audit logs for actions performed by a user.

        Args:
            actor_id: The acting user's ID.
            page: The page number (1-indexed).
            per_page: Number of items per page.

        Returns:
            A paginated dict of audit log entries.
        """
        return self.get_paginated(
            page=page,
            per_page=per_page,
            filters=[AuditLog.actor_id == actor_id],
            order_by=AuditLog.timestamp.desc(),
        )

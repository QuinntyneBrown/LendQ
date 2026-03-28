from __future__ import annotations

from app.models.user import Role
from app.repositories.base import BaseRepository


class RoleRepository(BaseRepository):
    model = Role

    def get_by_name(self, name: str) -> Role | None:
        """Fetch a role by its unique name."""
        return Role.query.filter_by(name=name).first()

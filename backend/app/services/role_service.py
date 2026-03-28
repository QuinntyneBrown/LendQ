from __future__ import annotations

import logging

from app.errors.exceptions import NotFoundError
from app.extensions import db
from app.models.user import Role
from app.repositories.role_repository import RoleRepository

logger = logging.getLogger(__name__)


class RoleService:
    def __init__(self) -> None:
        """Initialize RoleService with the role repository."""
        self.role_repo = RoleRepository()

    def list_roles(self) -> list[Role]:
        """Fetch all available roles."""
        return self.role_repo.get_all()

    def get_role(self, role_id: str) -> Role:
        """Fetch a role by ID.

        Raises:
            NotFoundError: If no role exists with the given ID.
        """
        role = self.role_repo.get_by_id(role_id)
        if not role:
            raise NotFoundError("Role not found")
        return role

    def update_permissions(self, role_id: str, permissions: list) -> Role:
        """Update the permissions for a role by ID.

        Args:
            role_id: The role's unique identifier.
            permissions: The new list of permission strings.

        Returns:
            The updated Role instance.

        Raises:
            NotFoundError: If no role exists with the given ID.
        """
        role = self.get_role(role_id)
        role.permissions = permissions
        db.session.commit()
        logger.info("Role %s permissions updated", role_id)
        return role

    def update_permissions_by_name(self, role_name: str, permissions: list) -> Role:
        """Update the permissions for a role by name.

        Args:
            role_name: The role's name (e.g. 'Admin', 'Borrower').
            permissions: The new list of permission strings.

        Returns:
            The updated Role instance.

        Raises:
            NotFoundError: If no role exists with the given name.
        """
        role = self.role_repo.get_by_name(role_name)
        if not role:
            raise NotFoundError("Role not found")
        role.permissions = permissions
        db.session.commit()
        logger.info("Role '%s' permissions updated", role_name)
        return role

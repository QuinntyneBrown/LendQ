import logging

from app.errors.exceptions import NotFoundError
from app.extensions import db
from app.repositories.role_repository import RoleRepository

logger = logging.getLogger(__name__)


class RoleService:
    def __init__(self):
        self.role_repo = RoleRepository()

    def list_roles(self):
        return self.role_repo.get_all()

    def get_role(self, role_id):
        role = self.role_repo.get_by_id(role_id)
        if not role:
            raise NotFoundError("Role not found")
        return role

    def update_permissions(self, role_id, permissions):
        role = self.get_role(role_id)
        role.permissions = permissions
        db.session.commit()
        logger.info("Role %s permissions updated", role_id)
        return role

    def update_permissions_by_name(self, role_name, permissions):
        role = self.role_repo.get_by_name(role_name)
        if not role:
            raise NotFoundError("Role not found")
        role.permissions = permissions
        db.session.commit()
        logger.info("Role '%s' permissions updated", role_name)
        return role

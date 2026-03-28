import logging

from app.errors.exceptions import ConflictError, NotFoundError
from app.extensions import db
from app.models.user import User
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository
from app.services.audit_service import AuditService
from app.services.password_service import PasswordService

logger = logging.getLogger(__name__)


class UserService:
    def __init__(self):
        self.user_repo = UserRepository()
        self.role_repo = RoleRepository()
        self.password_service = PasswordService()
        self.audit_service = AuditService()

    def list_users(self, page=1, per_page=20, search=None, role=None, is_active=None):
        return self.user_repo.search(
            query_str=search, page=page, per_page=per_page, role=role, is_active=is_active
        )

    def get_user(self, user_id):
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        return user

    def create_user(self, data, actor_id=None):
        existing = self.user_repo.get_by_email(data["email"])
        if existing:
            raise ConflictError("A user with this email already exists")

        password_hash = self.password_service.hash_password(data["password"])
        user = User(
            name=data["name"],
            email=data["email"],
            password_hash=password_hash,
        )

        for role_id in data.get("role_ids", []):
            role = self.role_repo.get_by_id(role_id)
            if role:
                user.roles.append(role)

        if not user.roles:
            borrower = self.role_repo.get_by_name("Borrower")
            if borrower:
                user.roles.append(borrower)

        self.user_repo.create(user)
        self.audit_service.log("CREATE", "User", user.id, actor_id=actor_id, after_value={
            "name": user.name, "email": user.email, "roles": user.role_names,
        })
        db.session.commit()
        logger.info("User created: %s by %s", user.id, actor_id)
        return user

    def update_user(self, user_id, data, actor_id=None):
        user = self.get_user(user_id)
        before = {"name": user.name, "email": user.email, "is_active": user.is_active}

        if "email" in data and data["email"] != user.email:
            existing = self.user_repo.get_by_email(data["email"])
            if existing:
                raise ConflictError("A user with this email already exists")
            user.email = data["email"]

        if "name" in data:
            user.name = data["name"]
        if "is_active" in data:
            user.is_active = data["is_active"]
        if "role_ids" in data:
            user.roles = []
            for role_id in data["role_ids"]:
                role = self.role_repo.get_by_id(role_id)
                if role:
                    user.roles.append(role)

        self.audit_service.log("UPDATE", "User", user.id, actor_id=actor_id,
                               before_value=before,
                               after_value={"name": user.name, "email": user.email, "is_active": user.is_active})
        db.session.commit()
        logger.info("User updated: %s by %s", user.id, actor_id)
        return user

    def delete_user(self, user_id, actor_id=None):
        user = self.get_user(user_id)
        user.is_active = False
        self.audit_service.log("DEACTIVATE", "User", user.id, actor_id=actor_id)
        db.session.commit()
        logger.info("User deactivated: %s by %s", user.id, actor_id)

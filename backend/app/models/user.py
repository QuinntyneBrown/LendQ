from datetime import UTC, datetime

from app.extensions import db
from app.models.base import TimestampMixin, UUIDMixin


class UserRole(db.Model):
    __tablename__ = "user_roles"

    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), primary_key=True)
    role_id = db.Column(db.String(36), db.ForeignKey("roles.id"), primary_key=True)
    assigned_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(UTC))


class Role(UUIDMixin, db.Model):
    __tablename__ = "roles"

    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.String(255))
    permissions = db.Column(db.JSON, default=list)

    users = db.relationship("User", secondary="user_roles", back_populates="roles")


class User(UUIDMixin, TimestampMixin, db.Model):
    __tablename__ = "users"

    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    email_verified = db.Column(db.Boolean, default=False, nullable=False)
    session_version = db.Column(db.Integer, default=1, nullable=False)

    roles = db.relationship("Role", secondary="user_roles", back_populates="users")
    auth_sessions = db.relationship(
        "AuthSession", foreign_keys="AuthSession.user_id", cascade="all, delete-orphan"
    )
    notifications = db.relationship("Notification", back_populates="user")

    @property
    def role_names(self):
        return [role.name for role in self.roles]

    def has_role(self, role_name):
        return role_name in self.role_names

    def has_any_role(self, *role_names):
        return any(r in self.role_names for r in role_names)

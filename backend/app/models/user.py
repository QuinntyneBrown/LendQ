import uuid
from datetime import datetime, timezone

from app.extensions import db


class UserRole(db.Model):
    __tablename__ = "user_roles"

    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), primary_key=True)
    role_id = db.Column(db.String(36), db.ForeignKey("roles.id"), primary_key=True)
    assigned_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )


class Role(db.Model):
    __tablename__ = "roles"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.String(255))
    permissions = db.Column(db.JSON, default=list)

    users = db.relationship("User", secondary="user_roles", back_populates="roles")


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    reset_token_hash = db.Column(db.String(255), nullable=True)
    reset_token_expires = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    roles = db.relationship("Role", secondary="user_roles", back_populates="users")
    refresh_tokens = db.relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )
    notifications = db.relationship("Notification", back_populates="user")

    @property
    def role_names(self):
        return [role.name for role in self.roles]

    def has_role(self, role_name):
        return role_name in self.role_names

    def has_any_role(self, *role_names):
        return any(r in self.role_names for r in role_names)

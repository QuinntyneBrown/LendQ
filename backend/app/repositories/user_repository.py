from __future__ import annotations

from sqlalchemy import or_

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository):
    model = User

    def get_by_email(self, email: str) -> User | None:
        """Fetch a user by their email address.

        Args:
            email: The email address to look up.

        Returns:
            The matching User, or None if not found.
        """
        return User.query.filter_by(email=email).first()

    def get_by_reset_token_hash(self, token_hash: str) -> User | None:
        """Fetch a user by their password-reset token hash.

        Args:
            token_hash: The hashed reset token to look up.

        Returns:
            The matching User, or None if not found.
        """
        return User.query.filter_by(reset_token_hash=token_hash).first()

    def search(
        self,
        query_str: str,
        page: int = 1,
        per_page: int = 20,
        role: str | None = None,
        is_active: bool | None = None,
    ) -> dict:
        """Search users by name or email with optional filters.

        Args:
            query_str: The search term matched against name and email.
            page: The page number (1-indexed).
            per_page: Number of items per page.
            role: Optional role name to filter by.
            is_active: Optional flag to filter active/inactive users.

        Returns:
            A paginated dict with keys ``items``, ``total``, ``page``,
            ``per_page``, and ``pages``.
        """
        query = User.query
        if query_str:
            search = f"%{query_str}%"
            query = query.filter(or_(User.name.ilike(search), User.email.ilike(search)))
        if is_active is not None:
            query = query.filter(User.is_active == is_active)
        if role:
            query = query.filter(User.roles.any(name=role))
        query = query.order_by(User.created_at.desc())
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        return {
            "items": pagination.items,
            "total": pagination.total,
            "page": pagination.page,
            "per_page": pagination.per_page,
            "pages": pagination.pages,
        }

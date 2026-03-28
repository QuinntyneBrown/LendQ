from __future__ import annotations

from typing import Any

from flask_sqlalchemy.model import Model

from app.extensions import db


class BaseRepository:
    model: type[Model] | None = None

    def get_by_id(self, entity_id: str) -> Model | None:
        """Fetch a single entity by its primary key."""
        return db.session.get(self.model, entity_id)

    def get_all(self) -> list[Model]:
        """Return all entities of this repository's model type."""
        return self.model.query.all()

    def get_paginated(
        self,
        page: int = 1,
        per_page: int = 20,
        filters: list | None = None,
        order_by: Any | None = None,
    ) -> dict:
        """Return a paginated dictionary of entities.

        Args:
            page: The page number (1-indexed).
            per_page: Number of items per page.
            filters: Optional SQLAlchemy filter expressions.
            order_by: Optional column or expression to order results.

        Returns:
            A dict with keys ``items``, ``total``, ``page``,
            ``per_page``, and ``pages``.
        """
        query = self.model.query
        if filters:
            for f in filters:
                query = query.filter(f)
        if order_by is not None:
            query = query.order_by(order_by)
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        return {
            "items": pagination.items,
            "total": pagination.total,
            "page": pagination.page,
            "per_page": pagination.per_page,
            "pages": pagination.pages,
        }

    def create(self, entity: Model) -> Model:
        """Add a new entity to the session and flush.

        Args:
            entity: The model instance to persist.

        Returns:
            The persisted entity.
        """
        db.session.add(entity)
        db.session.flush()
        return entity

    def update(self, entity: Model) -> Model:
        """Flush pending changes for an existing entity.

        Args:
            entity: The model instance with updated attributes.

        Returns:
            The updated entity.
        """
        db.session.flush()
        return entity

    def delete(self, entity: Model) -> None:
        """Remove an entity from the database.

        Args:
            entity: The model instance to delete.
        """
        db.session.delete(entity)
        db.session.flush()

    def commit(self) -> None:
        """Commit the current database transaction."""
        db.session.commit()

    def rollback(self) -> None:
        """Roll back the current database transaction."""
        db.session.rollback()

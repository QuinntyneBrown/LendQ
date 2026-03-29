from __future__ import annotations

from app.extensions import db
from app.models.savings_goal import SavingsGoal, SavingsGoalStatus
from app.models.savings_goal_entry import SavingsGoalEntry
from app.repositories.base import BaseRepository


class SavingsGoalRepository(BaseRepository):
    model = SavingsGoal

    def get_by_user_id(self, user_id: str) -> list[SavingsGoal]:
        """Return all active (non-CANCELLED) goals for a user."""
        return SavingsGoal.query.filter(
            SavingsGoal.user_id == user_id,
            SavingsGoal.status != SavingsGoalStatus.CANCELLED,
        ).order_by(SavingsGoal.created_at.desc()).all()

    def get_by_user_paginated(
        self,
        user_id: str,
        page: int = 1,
        per_page: int = 20,
    ) -> dict:
        """Return paginated non-CANCELLED goals for a user."""
        query = SavingsGoal.query.filter(
            SavingsGoal.user_id == user_id,
            SavingsGoal.status != SavingsGoalStatus.CANCELLED,
        ).order_by(SavingsGoal.created_at.desc())
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        return {
            "items": pagination.items,
            "total": pagination.total,
            "page": pagination.page,
            "per_page": pagination.per_page,
            "pages": pagination.pages,
        }

    def lock_for_update(self, goal_id: str) -> SavingsGoal | None:
        """Fetch a goal with a row-level lock for update."""
        return db.session.query(SavingsGoal).filter_by(id=goal_id).with_for_update().first()


class SavingsGoalEntryRepository(BaseRepository):
    model = SavingsGoalEntry

    def get_by_goal_paginated(
        self,
        goal_id: str,
        page: int = 1,
        per_page: int = 20,
    ) -> dict:
        """Return paginated entries for a goal, ordered by created_at desc."""
        query = SavingsGoalEntry.query.filter_by(goal_id=goal_id).order_by(
            SavingsGoalEntry.created_at.desc()
        )
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        return {
            "items": pagination.items,
            "total": pagination.total,
            "page": pagination.page,
            "per_page": pagination.per_page,
            "pages": pagination.pages,
        }

    def get_by_idempotency_key(self, key_hash: str) -> SavingsGoalEntry | None:
        """Find an entry by its idempotency key hash."""
        return SavingsGoalEntry.query.filter_by(idempotency_key_hash=key_hash).first()

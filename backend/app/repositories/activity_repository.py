from __future__ import annotations

from sqlalchemy import or_

from app.models.activity import ActivityItem
from app.models.loan import Loan
from app.repositories.base import BaseRepository


class ActivityRepository(BaseRepository):
    model = ActivityItem

    def get_recent(self, user_id: str, limit: int = 20) -> list[ActivityItem]:
        """Return the most recent activity items for a user.

        Includes activities the user performed directly as well as
        activities on loans where the user is creditor or borrower.

        Args:
            user_id: The user whose activity to retrieve.
            limit: Maximum number of items to return.

        Returns:
            List of ActivityItem instances, newest first.
        """
        return (
            ActivityItem.query.filter(
                or_(
                    ActivityItem.user_id == user_id,
                    ActivityItem.loan_id.in_(
                        Loan.query.filter(
                            or_(
                                Loan.creditor_id == user_id,
                                Loan.borrower_id == user_id,
                            )
                        ).with_entities(Loan.id)
                    ),
                )
            )
            .order_by(ActivityItem.timestamp.desc())
            .limit(limit)
            .all()
        )

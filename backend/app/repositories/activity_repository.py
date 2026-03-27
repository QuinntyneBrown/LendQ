from sqlalchemy import or_

from app.models.activity import ActivityItem
from app.models.loan import Loan
from app.repositories.base import BaseRepository


class ActivityRepository(BaseRepository):
    model = ActivityItem

    def get_recent(self, user_id, limit=20):
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

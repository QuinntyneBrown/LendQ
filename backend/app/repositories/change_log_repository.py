from __future__ import annotations

from app.models.change_log import ChangeLog
from app.repositories.base import BaseRepository


class ChangeLogRepository(BaseRepository):
    model = ChangeLog

    def get_by_entity(self, entity_type: str, entity_id: str) -> list[ChangeLog]:
        """Return change logs for a specific entity, newest first.

        Args:
            entity_type: The entity type name (e.g. ``"Loan"``).
            entity_id: The entity's ID.

        Returns:
            List of ChangeLog entries ordered by timestamp descending.
        """
        return (
            ChangeLog.query.filter_by(entity_type=entity_type, entity_id=entity_id)
            .order_by(ChangeLog.changed_at.desc())
            .all()
        )

    def get_by_loan(self, loan_id: str) -> list[ChangeLog]:
        """Return change logs for a loan and all its payments.

        Args:
            loan_id: The loan ID to look up.

        Returns:
            Combined list of loan and payment ChangeLog entries,
            newest first.
        """
        from app.models.payment import Payment

        payment_ids = [p.id for p in Payment.query.filter_by(loan_id=loan_id).all()]
        loan_changes = ChangeLog.query.filter_by(entity_type="Loan", entity_id=loan_id)
        payment_changes = (
            ChangeLog.query.filter(
                ChangeLog.entity_type == "Payment",
                ChangeLog.entity_id.in_(payment_ids),
            )
            if payment_ids
            else ChangeLog.query.filter(False)
        )

        return loan_changes.union(payment_changes).order_by(ChangeLog.changed_at.desc()).all()

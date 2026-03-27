from app.models.change_log import ChangeLog
from app.repositories.base import BaseRepository


class ChangeLogRepository(BaseRepository):
    model = ChangeLog

    def get_by_entity(self, entity_type, entity_id):
        return (
            ChangeLog.query.filter_by(entity_type=entity_type, entity_id=entity_id)
            .order_by(ChangeLog.changed_at.desc())
            .all()
        )

    def get_by_loan(self, loan_id):
        from app.models.payment import Payment

        payment_ids = [
            p.id for p in Payment.query.filter_by(loan_id=loan_id).all()
        ]
        loan_changes = ChangeLog.query.filter_by(
            entity_type="Loan", entity_id=loan_id
        )
        payment_changes = ChangeLog.query.filter(
            ChangeLog.entity_type == "Payment",
            ChangeLog.entity_id.in_(payment_ids),
        ) if payment_ids else ChangeLog.query.filter(False)

        return (
            loan_changes.union(payment_changes)
            .order_by(ChangeLog.changed_at.desc())
            .all()
        )

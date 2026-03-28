from datetime import date, timedelta

from sqlalchemy import and_

from app.models.payment import Payment, PaymentStatus
from app.repositories.base import BaseRepository


class PaymentRepository(BaseRepository):
    model = Payment

    def get_schedule(self, loan_id):
        return (
            Payment.query.filter_by(loan_id=loan_id)
            .order_by(Payment.due_date.asc())
            .all()
        )

    def get_next_due(self, loan_id):
        return (
            Payment.query.filter(
                Payment.loan_id == loan_id,
                Payment.status.in_([PaymentStatus.SCHEDULED, PaymentStatus.PARTIAL, PaymentStatus.RESCHEDULED]),
            )
            .order_by(Payment.due_date.asc())
            .first()
        )

    def get_overdue_payments(self, as_of=None):
        if as_of is None:
            as_of = date.today()
        return Payment.query.filter(
            Payment.due_date < as_of,
            Payment.status.in_([PaymentStatus.SCHEDULED, PaymentStatus.PARTIAL, PaymentStatus.RESCHEDULED]),
        ).all()

    def get_due_soon(self, days=3, as_of=None):
        if as_of is None:
            as_of = date.today()
        target = as_of + timedelta(days=days)
        return Payment.query.filter(
            and_(
                Payment.due_date >= as_of,
                Payment.due_date <= target,
                Payment.status == PaymentStatus.SCHEDULED,
            )
        ).all()

    def get_payments_for_loan_by_status(self, loan_id, statuses):
        return (
            Payment.query.filter(
                Payment.loan_id == loan_id,
                Payment.status.in_(statuses),
            )
            .order_by(Payment.due_date.asc())
            .all()
        )

    def get_upcoming_count(self, user_id, days=7):
        from app.models.loan import Loan

        as_of = date.today()
        target = as_of + timedelta(days=days)
        return (
            Payment.query.join(Loan)
            .filter(
                (Loan.creditor_id == user_id) | (Loan.borrower_id == user_id),
                Payment.due_date >= as_of,
                Payment.due_date <= target,
                Payment.status.in_([PaymentStatus.SCHEDULED, PaymentStatus.RESCHEDULED]),
            )
            .count()
        )

    def get_overdue_count(self, user_id):
        from app.models.loan import Loan

        return (
            Payment.query.join(Loan)
            .filter(
                (Loan.creditor_id == user_id) | (Loan.borrower_id == user_id),
                Payment.status == PaymentStatus.OVERDUE,
            )
            .count()
        )

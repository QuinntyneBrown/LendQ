import logging
from datetime import date
from decimal import Decimal

from app.errors.exceptions import NotFoundError, ValidationError
from app.extensions import db
from app.models.loan import LoanStatus
from app.models.payment import PaymentStatus
from app.repositories.loan_repository import LoanRepository
from app.repositories.payment_repository import PaymentRepository
from app.services.activity_service import ActivityService
from app.services.balance_service import BalanceService
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)


class PaymentService:
    def __init__(self):
        self.payment_repo = PaymentRepository()
        self.loan_repo = LoanRepository()
        self.balance_service = BalanceService()
        self.notification_service = NotificationService()
        self.activity_service = ActivityService()

    def get_schedule(self, loan_id):
        return self.payment_repo.get_schedule(loan_id)

    def record_payment(self, loan_id, data, user):
        loan = self.loan_repo.get_by_id(loan_id)
        if not loan:
            raise NotFoundError("Loan not found")

        amount = Decimal(str(data["amount"]))
        if amount <= 0:
            raise ValidationError("Payment amount must be greater than zero")

        paid_date = data["paid_date"]
        notes = data.get("notes")
        remaining = amount

        pending = self.payment_repo.get_payments_for_loan_by_status(
            loan_id, [PaymentStatus.SCHEDULED, PaymentStatus.PARTIAL, PaymentStatus.RESCHEDULED]
        )

        if not pending:
            raise ValidationError("No pending payments for this loan")

        for payment in pending:
            if remaining <= 0:
                break

            owed = Decimal(str(payment.amount_due)) - Decimal(str(payment.amount_paid or 0))
            if remaining >= owed:
                payment.amount_paid = Decimal(str(payment.amount_due))
                payment.status = PaymentStatus.PAID
                payment.paid_date = paid_date
                remaining -= owed
            else:
                payment.amount_paid = Decimal(str(payment.amount_paid or 0)) + remaining
                payment.status = PaymentStatus.PARTIAL
                remaining = Decimal("0")

            if notes:
                payment.notes = notes

        # Check if loan is fully paid off
        balance = self.balance_service.get_outstanding_balance(loan_id)
        if balance <= 0:
            loan.status = LoanStatus.PAID_OFF

        self.activity_service.log_activity(
            user_id=user.id,
            event_type="PAYMENT_RECORDED",
            description=f"Payment of ${amount} recorded",
            loan_id=loan_id,
        )
        self.notification_service.notify_payment_received(loan, amount)

        db.session.commit()
        logger.info("Payment recorded for loan %s: $%s", loan_id, amount)

    def reschedule_payment(self, payment_id, data, user):
        payment = self.payment_repo.get_by_id(payment_id)
        if not payment:
            raise NotFoundError("Payment not found")

        if payment.status not in [PaymentStatus.SCHEDULED, PaymentStatus.RESCHEDULED]:
            raise ValidationError("Only scheduled payments can be rescheduled")

        old_date = payment.due_date
        if not payment.original_due_date:
            payment.original_due_date = old_date

        payment.due_date = data["new_date"]
        payment.status = PaymentStatus.RESCHEDULED

        from app.services.change_log_service import ChangeLogService
        change_log_service = ChangeLogService()
        change_log_service.log_change(
            entity_type="Payment", entity_id=payment.id,
            field_name="due_date",
            old_value=str(old_date), new_value=str(data["new_date"]),
            changed_by=user.id, reason=data.get("reason"),
        )

        loan = self.loan_repo.get_by_id(payment.loan_id)
        self.activity_service.log_activity(
            user_id=user.id,
            event_type="PAYMENT_RESCHEDULED",
            description=f"Payment rescheduled from {old_date} to {data['new_date']}",
            loan_id=payment.loan_id,
        )
        self.notification_service.notify_schedule_changed(loan, user.id)

        db.session.commit()
        logger.info("Payment %s rescheduled to %s", payment_id, data["new_date"])

    def pause_payments(self, loan_id, data, user):
        loan = self.loan_repo.get_by_id(loan_id)
        if not loan:
            raise NotFoundError("Loan not found")

        from app.services.change_log_service import ChangeLogService
        change_log_service = ChangeLogService()

        for pid in data["payment_ids"]:
            payment = self.payment_repo.get_by_id(pid)
            if not payment or payment.loan_id != loan_id:
                continue
            if payment.status != PaymentStatus.SCHEDULED:
                continue

            payment.status = PaymentStatus.PAUSED
            change_log_service.log_change(
                entity_type="Payment", entity_id=payment.id,
                field_name="status",
                old_value=PaymentStatus.SCHEDULED, new_value=PaymentStatus.PAUSED,
                changed_by=user.id, reason=data.get("reason"),
            )

        self.activity_service.log_activity(
            user_id=user.id,
            event_type="PAYMENTS_PAUSED",
            description=f"{len(data['payment_ids'])} payment(s) paused",
            loan_id=loan_id,
        )
        self.notification_service.notify_schedule_changed(loan, user.id)

        db.session.commit()
        logger.info("Payments paused for loan %s", loan_id)

    def get_history(self, loan_id):
        from app.repositories.change_log_repository import ChangeLogRepository
        change_log_repo = ChangeLogRepository()
        return change_log_repo.get_by_loan(loan_id)

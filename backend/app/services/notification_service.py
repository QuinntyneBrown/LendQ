import logging

from app.extensions import db
from app.models.notification import Notification, NotificationType
from app.repositories.notification_repository import NotificationRepository

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self):
        self.notification_repo = NotificationRepository()

    def list_notifications(self, user_id, page=1, per_page=20, notification_type=None):
        return self.notification_repo.get_by_user(
            user_id, page=page, per_page=per_page, notification_type=notification_type
        )

    def get_unread_count(self, user_id):
        return self.notification_repo.get_unread_count(user_id)

    def mark_read(self, notification_id, user_id):
        notification = self.notification_repo.get_by_id(notification_id)
        if not notification or notification.user_id != user_id:
            return
        notification.is_read = True
        db.session.commit()

    def mark_all_read(self, user_id):
        self.notification_repo.mark_all_read(user_id)
        db.session.commit()

    def create_notification(self, user_id, notification_type, message, loan_id=None):
        if loan_id:
            existing = self.notification_repo.check_duplicate(user_id, notification_type, loan_id)
            if existing:
                return existing

        notification = Notification(
            user_id=user_id,
            type=notification_type,
            message=message,
            loan_id=loan_id,
        )
        self.notification_repo.create(notification)
        db.session.flush()
        logger.info("Notification created: type=%s user=%s", notification_type, user_id)
        return notification

    def notify_loan_created(self, loan):
        self.create_notification(
            user_id=loan.borrower_id,
            notification_type=NotificationType.LOAN_MODIFIED,
            message=f"A new loan of ${loan.principal} has been created for you by {loan.creditor.name}",
            loan_id=loan.id,
        )

    def notify_loan_modified(self, loan, modified_by_user_id):
        recipient_id = (
            loan.borrower_id if modified_by_user_id == loan.creditor_id else loan.creditor_id
        )
        self.create_notification(
            user_id=recipient_id,
            notification_type=NotificationType.LOAN_MODIFIED,
            message=f"Loan terms have been modified for loan #{loan.id[:8]}",
            loan_id=loan.id,
        )

    def notify_payment_received(self, loan, amount):
        self.create_notification(
            user_id=loan.creditor_id,
            notification_type=NotificationType.PAYMENT_RECEIVED,
            message=f"Payment of ${amount} received for loan #{loan.id[:8]}",
            loan_id=loan.id,
        )

    def notify_schedule_changed(self, loan, changed_by_user_id):
        recipient_id = (
            loan.borrower_id if changed_by_user_id == loan.creditor_id else loan.creditor_id
        )
        self.create_notification(
            user_id=recipient_id,
            notification_type=NotificationType.SCHEDULE_CHANGED,
            message=f"Payment schedule changed for loan #{loan.id[:8]}",
            loan_id=loan.id,
        )

    def notify_payment_due(self, payment):
        loan = payment.loan
        self.create_notification(
            user_id=loan.borrower_id,
            notification_type=NotificationType.PAYMENT_DUE,
            message=f"Payment of ${payment.amount_due} due on {payment.due_date}",
            loan_id=loan.id,
        )

    def notify_payment_overdue(self, payment):
        loan = payment.loan
        for user_id in [loan.borrower_id, loan.creditor_id]:
            self.create_notification(
                user_id=user_id,
                notification_type=NotificationType.PAYMENT_OVERDUE,
                message=f"Payment of ${payment.amount_due} is overdue (was due {payment.due_date})",
                loan_id=loan.id,
            )

from __future__ import annotations

import logging
from decimal import Decimal

from app.extensions import db
from app.models.loan import Loan
from app.models.notification import Notification, NotificationType
from app.models.payment import Payment
from app.repositories.notification_repository import NotificationRepository

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self) -> None:
        """Initialize NotificationService with the notification repository."""
        self.notification_repo = NotificationRepository()

    def list_notifications(
        self, user_id: str, page: int = 1, per_page: int = 20, notification_type: str | None = None
    ) -> dict:
        """List notifications for a user with optional type filtering.

        Args:
            user_id: The user's unique identifier.
            page: Page number (1-indexed).
            per_page: Number of results per page.
            notification_type: Optional notification type filter.

        Returns:
            A paginated result dict.
        """
        return self.notification_repo.get_by_user(
            user_id, page=page, per_page=per_page, notification_type=notification_type
        )

    def get_unread_count(self, user_id: str) -> int:
        """Return the number of unread notifications for a user."""
        return self.notification_repo.get_unread_count(user_id)

    def mark_read(self, notification_id: str, user_id: str) -> None:
        """Mark a single notification as read.

        Args:
            notification_id: The notification's unique identifier.
            user_id: The owning user's ID (for authorization).
        """
        notification = self.notification_repo.get_by_id(notification_id)
        if not notification or notification.user_id != user_id:
            return
        notification.is_read = True
        db.session.commit()

    def mark_all_read(self, user_id: str) -> None:
        """Mark all notifications as read for a user."""
        self.notification_repo.mark_all_read(user_id)
        db.session.commit()

    def create_notification(
        self, user_id: str, notification_type: str, message: str, loan_id: str | None = None
    ) -> Notification:
        """Create a notification, deduplicating by loan if applicable.

        Args:
            user_id: The recipient user's ID.
            notification_type: The notification type constant.
            message: Human-readable notification message.
            loan_id: Optional associated loan ID for deduplication.

        Returns:
            The created or existing Notification instance.
        """
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

    def notify_loan_created(self, loan: Loan) -> None:
        """Notify the borrower that a new loan has been created for them.

        Args:
            loan: The newly created Loan instance.
        """
        self.create_notification(
            user_id=loan.borrower_id,
            notification_type=NotificationType.LOAN_MODIFIED,
            message=f"A new loan of ${loan.principal} has been created for you by {loan.creditor.name}",
            loan_id=loan.id,
        )

    def notify_loan_modified(self, loan: Loan, modified_by_user_id: str) -> None:
        """Notify the other party that loan terms have been modified.

        Args:
            loan: The modified Loan instance.
            modified_by_user_id: ID of the user who made the modification.
        """
        recipient_id = (
            loan.borrower_id if modified_by_user_id == loan.creditor_id else loan.creditor_id
        )
        self.create_notification(
            user_id=recipient_id,
            notification_type=NotificationType.LOAN_MODIFIED,
            message=f"Loan terms have been modified for loan #{loan.id[:8]}",
            loan_id=loan.id,
        )

    def notify_payment_received(self, loan: Loan, amount: Decimal) -> None:
        """Notify the creditor that a payment has been received.

        Args:
            loan: The Loan instance the payment was applied to.
            amount: The payment amount received.
        """
        self.create_notification(
            user_id=loan.creditor_id,
            notification_type=NotificationType.PAYMENT_RECEIVED,
            message=f"Payment of ${amount} received for loan #{loan.id[:8]}",
            loan_id=loan.id,
        )

    def notify_schedule_changed(self, loan: Loan, changed_by_user_id: str) -> None:
        """Notify the other party that the payment schedule has changed.

        Args:
            loan: The Loan instance whose schedule changed.
            changed_by_user_id: ID of the user who made the change.
        """
        recipient_id = (
            loan.borrower_id if changed_by_user_id == loan.creditor_id else loan.creditor_id
        )
        self.create_notification(
            user_id=recipient_id,
            notification_type=NotificationType.SCHEDULE_CHANGED,
            message=f"Payment schedule changed for loan #{loan.id[:8]}",
            loan_id=loan.id,
        )

    def notify_payment_due(self, payment: Payment) -> None:
        """Notify the borrower that a payment is due soon.

        Args:
            payment: The upcoming Payment instance.
        """
        loan = payment.loan
        self.create_notification(
            user_id=loan.borrower_id,
            notification_type=NotificationType.PAYMENT_DUE,
            message=f"Payment of ${payment.amount_due} due on {payment.due_date}",
            loan_id=loan.id,
        )

    def notify_payment_overdue(self, payment: Payment) -> None:
        """Notify both borrower and creditor that a payment is overdue.

        Args:
            payment: The overdue Payment instance.
        """
        loan = payment.loan
        for user_id in [loan.borrower_id, loan.creditor_id]:
            self.create_notification(
                user_id=user_id,
                notification_type=NotificationType.PAYMENT_OVERDUE,
                message=f"Payment of ${payment.amount_due} is overdue (was due {payment.due_date})",
                loan_id=loan.id,
            )

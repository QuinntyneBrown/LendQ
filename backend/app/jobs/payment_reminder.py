import logging

from app.extensions import db
from app.repositories.payment_repository import PaymentRepository
from app.services.email_service import EmailService
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)


def send_payment_reminders(app):
    with app.app_context():
        payment_repo = PaymentRepository()
        notification_service = NotificationService()
        email_service = EmailService()

        due_soon = payment_repo.get_due_soon(days=3)
        count = 0

        for payment in due_soon:
            loan = payment.loan
            notification_service.notify_payment_due(payment)

            borrower = loan.borrower
            if borrower:
                email_service.send_payment_reminder(
                    to=borrower.email,
                    loan_id=loan.id,
                    amount=payment.amount_due,
                    due_date=payment.due_date,
                )

            count += 1

        db.session.commit()
        logger.info("Payment reminders: %d reminders sent", count)

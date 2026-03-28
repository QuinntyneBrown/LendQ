import logging
from datetime import date

from app.extensions import db
from app.models.loan import LoanStatus
from app.models.payment import PaymentStatus
from app.repositories.payment_repository import PaymentRepository
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)


def check_overdue_payments(app):
    with app.app_context():
        payment_repo = PaymentRepository()
        notification_service = NotificationService()

        overdue = payment_repo.get_overdue_payments(as_of=date.today())
        count = 0

        for payment in overdue:
            payment.status = PaymentStatus.OVERDUE
            notification_service.notify_payment_overdue(payment)

            loan = payment.loan
            if loan.status == LoanStatus.ACTIVE:
                loan.status = LoanStatus.OVERDUE

            count += 1

        db.session.commit()
        logger.info("Overdue checker: %d payments marked overdue", count)

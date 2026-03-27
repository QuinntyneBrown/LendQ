import logging

from app.services.email_service import EmailService

logger = logging.getLogger(__name__)


def send_email_task(to, subject, body):
    email_service = EmailService()
    email_service.send_email(to, subject, body)

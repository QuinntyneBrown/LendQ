import logging
import smtplib
from email.mime.text import MIMEText

from flask import current_app

logger = logging.getLogger(__name__)


class EmailService:
    def send_email(self, to, subject, body):
        try:
            msg = MIMEText(body, "html")
            msg["Subject"] = subject
            msg["From"] = "noreply@lendq.local"
            msg["To"] = to

            host = current_app.config.get("MAIL_HOST", "localhost")
            port = current_app.config.get("MAIL_PORT", 1025)

            with smtplib.SMTP(host, port) as server:
                server.send_message(msg)

            logger.info("Email sent to %s: %s", to, subject)
        except Exception:
            logger.exception("Failed to send email to %s", to)

    def send_password_reset(self, to, reset_token):
        reset_url = f"http://localhost:5173/reset-password?token={reset_token}"
        body = f"""
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <p><a href="{reset_url}">Reset Password</a></p>
        <p>If you did not request this, please ignore this email.</p>
        """
        self.send_email(to, "LendQ - Password Reset", body)

    def send_payment_reminder(self, to, loan_id, amount, due_date):
        body = f"""
        <h2>Payment Reminder</h2>
        <p>A payment of ${amount} is due on {due_date} for loan #{loan_id[:8]}.</p>
        """
        self.send_email(to, "LendQ - Payment Reminder", body)

    def send_payment_overdue(self, to, loan_id, amount, due_date):
        body = f"""
        <h2>Payment Overdue</h2>
        <p>A payment of ${amount} was due on {due_date} for loan #{loan_id[:8]} and is now overdue.</p>
        """
        self.send_email(to, "LendQ - Payment Overdue", body)

from __future__ import annotations

import logging
import smtplib
from datetime import date
from decimal import Decimal
from email.mime.text import MIMEText

from flask import current_app

logger = logging.getLogger(__name__)


class EmailService:
    def send_email(self, to: str, subject: str, body: str) -> None:
        """Send an HTML email via SMTP.

        Args:
            to: Recipient email address.
            subject: Email subject line.
            body: HTML email body.
        """
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

    def send_password_reset(self, to: str, reset_token: str) -> None:
        """Send a password reset email with a tokenized link.

        Args:
            to: Recipient email address.
            reset_token: The raw password-reset token to include in the link.
        """
        reset_url = f"http://localhost:5173/reset-password?token={reset_token}"
        body = f"""
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <p><a href="{reset_url}">Reset Password</a></p>
        <p>If you did not request this, please ignore this email.</p>
        """
        self.send_email(to, "LendQ - Password Reset", body)

    def send_payment_reminder(self, to: str, loan_id: str, amount: Decimal, due_date: date) -> None:
        """Send a payment reminder email to a borrower.

        Args:
            to: Recipient email address.
            loan_id: The loan's unique identifier.
            amount: The payment amount due.
            due_date: The payment due date.
        """
        body = f"""
        <h2>Payment Reminder</h2>
        <p>A payment of ${amount} is due on {due_date} for loan #{loan_id[:8]}.</p>
        """
        self.send_email(to, "LendQ - Payment Reminder", body)

    def send_payment_overdue(self, to: str, loan_id: str, amount: Decimal, due_date: date) -> None:
        """Send a payment overdue notification email.

        Args:
            to: Recipient email address.
            loan_id: The loan's unique identifier.
            amount: The overdue payment amount.
            due_date: The original due date that was missed.
        """
        body = f"""
        <h2>Payment Overdue</h2>
        <p>A payment of ${amount} was due on {due_date} for loan
        #{loan_id[:8]} and is now overdue.</p>
        """
        self.send_email(to, "LendQ - Payment Overdue", body)

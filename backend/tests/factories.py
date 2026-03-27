import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

from app.extensions import db
from app.models.activity import ActivityItem
from app.models.loan import Loan, LoanStatus
from app.models.notification import Notification, NotificationType
from app.models.payment import Payment, PaymentStatus
from app.models.user import Role, User
from app.services.password_service import PasswordService


class UserFactory:
    @staticmethod
    def create(name="Test User", email=None, role_name="Borrower", password="testpassword123"):
        if email is None:
            email = f"user_{uuid.uuid4().hex[:8]}@test.com"
        password_service = PasswordService()
        user = User(
            name=name,
            email=email,
            password_hash=password_service.hash_password(password),
        )
        role = Role.query.filter_by(name=role_name).first()
        if role:
            user.roles.append(role)
        db.session.add(user)
        db.session.flush()
        return user


class LoanFactory:
    @staticmethod
    def create(creditor_id=None, borrower_id=None, principal=1000.00,
               interest_rate=0.00, status=LoanStatus.ACTIVE):
        loan = Loan(
            creditor_id=creditor_id,
            borrower_id=borrower_id,
            description="Test Loan",
            principal=Decimal(str(principal)),
            interest_rate=Decimal(str(interest_rate)),
            repayment_frequency="monthly",
            start_date=date.today(),
            status=status,
        )
        db.session.add(loan)
        db.session.flush()
        return loan


class PaymentFactory:
    @staticmethod
    def create(loan_id=None, amount_due=100.00, due_date=None, status=PaymentStatus.SCHEDULED):
        if due_date is None:
            due_date = date.today()
        payment = Payment(
            loan_id=loan_id,
            amount_due=Decimal(str(amount_due)),
            due_date=due_date,
            status=status,
        )
        db.session.add(payment)
        db.session.flush()
        return payment


class NotificationFactory:
    @staticmethod
    def create(user_id=None, notification_type=NotificationType.SYSTEM, message="Test notification"):
        notification = Notification(
            user_id=user_id,
            type=notification_type,
            message=message,
        )
        db.session.add(notification)
        db.session.flush()
        return notification

import uuid
from datetime import date, timedelta

from app.extensions import db
from app.models.loan import Loan
from app.models.notification import Notification
from app.models.payment import Payment
from app.models.user import User
from app.services.password_service import PasswordService


class UserFactory:
    @staticmethod
    def create(name="Test User", email=None, role_name="Borrower", password="testpassword123"):
        from app.models.user import Role

        if email is None:
            email = f"{uuid.uuid4().hex[:8]}@test.com"

        password_service = PasswordService()
        user = User(
            name=name,
            email=email,
            password_hash=password_service.hash_password(password),
            email_verified=True,
            session_version=1,
        )
        role = Role.query.filter_by(name=role_name).first()
        if role:
            user.roles.append(role)
        db.session.add(user)
        db.session.commit()
        return user


class LoanFactory:
    @staticmethod
    def create(creditor_id=None, borrower_id=None, principal=5000,
               interest_rate=0, status="ACTIVE"):
        loan = Loan(
            creditor_id=creditor_id,
            borrower_id=borrower_id,
            description="Test Loan",
            principal=principal,
            interest_rate=interest_rate,
            repayment_frequency="MONTHLY",
            start_date=date.today(),
            status=status,
            notes="Test loan notes",
        )
        db.session.add(loan)
        db.session.commit()
        return loan


class PaymentFactory:
    @staticmethod
    def create(loan_id=None, amount_due=500, due_date=None, status="SCHEDULED"):
        if due_date is None:
            due_date = date.today() + timedelta(days=30)
        elif isinstance(due_date, str):
            due_date = date.fromisoformat(due_date)

        payment = Payment(
            loan_id=loan_id,
            amount_due=amount_due,
            amount_paid=0,
            due_date=due_date,
            status=status,
        )
        db.session.add(payment)
        db.session.commit()
        return payment


class NotificationFactory:
    @staticmethod
    def create(user_id=None, notification_type="SYSTEM", message="Test notification",
               title=None, body=None):
        notification = Notification(
            user_id=user_id,
            type=notification_type,
            title=title or "Test Notification",
            body=body or message,
            message=message,
        )
        db.session.add(notification)
        db.session.commit()
        return notification

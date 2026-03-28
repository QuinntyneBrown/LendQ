"""Database seeding script.

Usage:
    python -m app.seed --profile baseline
    python -m app.seed --profile demo
"""

import argparse
import sys
import uuid
from datetime import date, timedelta
from decimal import Decimal

from app import create_app
from app.extensions import db
from app.models.loan import Loan, LoanStatus
from app.models.notification import Notification, NotificationType
from app.models.payment import Payment, PaymentStatus
from app.models.user import Role, User
from app.services.password_service import PasswordService


def seed_baseline():
    """Seed roles and admin user."""
    password_service = PasswordService()

    roles_data = [
        (
            "Admin",
            "System administrator",
            ["users:read", "users:write", "roles:write", "loans:read", "loans:write"],
        ),
        (
            "Creditor",
            "Loan creator/manager",
            ["loans:create", "loans:read", "loans:write", "payments:write"],
        ),
        ("Borrower", "Loan recipient", ["loans:read", "payments:read", "payments:reschedule"]),
    ]

    roles = {}
    for name, description, permissions in roles_data:
        role = Role.query.filter_by(name=name).first()
        if not role:
            role = Role(name=name, description=description, permissions=permissions)
            db.session.add(role)
            print(f"  Created role: {name}")
        else:
            role.permissions = permissions
            print(f"  Updated role: {name}")
        roles[name] = role

    db.session.flush()

    admin = User.query.filter_by(email="admin@lendq.local").first()
    if not admin:
        admin = User(
            name="LendQ Admin",
            email="admin@lendq.local",
            password_hash=password_service.hash_password("admin123"),
            email_verified=True,
            session_version=1,
        )
        admin.roles.append(roles["Admin"])
        db.session.add(admin)
        print("  Created admin user: admin@lendq.local / admin123")
    else:
        print("  Admin user already exists")

    # E2E test users — names must match e2e/fixtures/roles.fixture.ts
    e2e_users = [
        ("Admin User", "admin@family.com", "password123", roles["Admin"]),
        ("Quinn Brown", "creditor@family.com", "password123", roles["Creditor"]),
        ("Sarah Williams", "borrower@family.com", "password123", roles["Borrower"]),
    ]
    for name, email, password, role in e2e_users:
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(
                name=name,
                email=email,
                password_hash=password_service.hash_password(password),
                email_verified=True,
                session_version=1,
            )
            user.roles.append(role)
            db.session.add(user)
            print(f"  Created e2e user: {email} / {password}")

    db.session.commit()
    print("Baseline seed complete.")


def seed_demo():
    """Seed demo data for development."""
    seed_baseline()

    password_service = PasswordService()
    creditor_role = Role.query.filter_by(name="Creditor").first()
    borrower_role = Role.query.filter_by(name="Borrower").first()

    creditor = User.query.filter_by(email="creditor@lendq.local").first()
    if not creditor:
        creditor = User(
            name="Jane Creditor",
            email="creditor@lendq.local",
            password_hash=password_service.hash_password("password123"),
            email_verified=True,
            session_version=1,
        )
        creditor.roles.append(creditor_role)
        db.session.add(creditor)
        print("  Created creditor: creditor@lendq.local / password123")

    borrower1 = User.query.filter_by(email="borrower1@lendq.local").first()
    if not borrower1:
        borrower1 = User(
            name="Bob Borrower",
            email="borrower1@lendq.local",
            password_hash=password_service.hash_password("password123"),
            email_verified=True,
            session_version=1,
        )
        borrower1.roles.append(borrower_role)
        db.session.add(borrower1)
        print("  Created borrower: borrower1@lendq.local / password123")

    borrower2 = User.query.filter_by(email="borrower2@lendq.local").first()
    if not borrower2:
        borrower2 = User(
            name="Alice Borrower",
            email="borrower2@lendq.local",
            password_hash=password_service.hash_password("password123"),
            email_verified=True,
            session_version=1,
        )
        borrower2.roles.append(borrower_role)
        db.session.add(borrower2)
        print("  Created borrower: borrower2@lendq.local / password123")

    db.session.flush()

    # Only seed loans if none exist
    if Loan.query.count() > 0:
        print("  Demo loans already exist, skipping")
        db.session.commit()
        print("Demo seed complete.")
        return

    today = date.today()

    # Active loan
    loan1 = Loan(
        creditor_id=creditor.id,
        borrower_id=borrower1.id,
        description="Personal loan for home improvement",
        principal=Decimal("5000.00"),
        interest_rate=Decimal("5.00"),
        repayment_frequency="MONTHLY",
        start_date=today - timedelta(days=60),
        status=LoanStatus.ACTIVE,
    )
    db.session.add(loan1)
    db.session.flush()

    for i in range(12):
        due = loan1.start_date + timedelta(days=30 * (i + 1))
        status = PaymentStatus.PAID if i < 2 else PaymentStatus.SCHEDULED
        p = Payment(
            loan_id=loan1.id,
            amount_due=Decimal("440.00"),
            amount_paid=Decimal("440.00") if status == PaymentStatus.PAID else Decimal("0"),
            due_date=due,
            status=status,
            paid_date=due if status == PaymentStatus.PAID else None,
        )
        db.session.add(p)

    # Overdue loan
    loan2 = Loan(
        creditor_id=creditor.id,
        borrower_id=borrower2.id,
        description="Emergency fund loan",
        principal=Decimal("2000.00"),
        interest_rate=Decimal("0.00"),
        repayment_frequency="MONTHLY",
        start_date=today - timedelta(days=90),
        status=LoanStatus.OVERDUE,
    )
    db.session.add(loan2)
    db.session.flush()

    for i in range(10):
        due = loan2.start_date + timedelta(days=30 * (i + 1))
        if i < 1:
            status = PaymentStatus.PAID
        elif due < today:
            status = PaymentStatus.OVERDUE
        else:
            status = PaymentStatus.SCHEDULED
        p = Payment(
            loan_id=loan2.id,
            amount_due=Decimal("200.00"),
            amount_paid=Decimal("200.00") if status == PaymentStatus.PAID else Decimal("0"),
            due_date=due,
            status=status,
            paid_date=due if status == PaymentStatus.PAID else None,
        )
        db.session.add(p)

    # Paid off loan
    loan3 = Loan(
        creditor_id=creditor.id,
        borrower_id=borrower1.id,
        description="Short-term bridge loan",
        principal=Decimal("1000.00"),
        interest_rate=Decimal("0.00"),
        repayment_frequency="MONTHLY",
        start_date=today - timedelta(days=120),
        status=LoanStatus.PAID_OFF,
    )
    db.session.add(loan3)
    db.session.flush()

    for i in range(4):
        due = loan3.start_date + timedelta(days=30 * (i + 1))
        p = Payment(
            loan_id=loan3.id,
            amount_due=Decimal("250.00"),
            amount_paid=Decimal("250.00"),
            due_date=due,
            status=PaymentStatus.PAID,
            paid_date=due,
        )
        db.session.add(p)

    # Notifications
    for user_id in [borrower1.id, borrower2.id]:
        db.session.add(
            Notification(
                user_id=user_id,
                type=NotificationType.SYSTEM,
                message="Welcome to LendQ!",
            )
        )

    # ── E2E test data for @family.com users ──
    e2e_creditor = User.query.filter_by(email="creditor@family.com").first()
    e2e_borrower = User.query.filter_by(email="borrower@family.com").first()

    if e2e_creditor and e2e_borrower:
        # Active loan – creditor lent to borrower
        e2e_loan1 = Loan(
            creditor_id=e2e_creditor.id,
            borrower_id=e2e_borrower.id,
            description="Kitchen renovation loan",
            principal=Decimal("5000.00"),
            interest_rate=Decimal("5.00"),
            repayment_frequency="MONTHLY",
            start_date=today - timedelta(days=60),
            status=LoanStatus.ACTIVE,
        )
        db.session.add(e2e_loan1)
        db.session.flush()

        for i in range(12):
            due = e2e_loan1.start_date + timedelta(days=30 * (i + 1))
            pstatus = PaymentStatus.PAID if i < 2 else PaymentStatus.SCHEDULED
            if pstatus == PaymentStatus.SCHEDULED and due < today:
                pstatus = PaymentStatus.OVERDUE
            p = Payment(
                loan_id=e2e_loan1.id,
                amount_due=Decimal("440.00"),
                amount_paid=Decimal("440.00") if pstatus == PaymentStatus.PAID else Decimal("0"),
                due_date=due,
                status=pstatus,
                paid_date=due if pstatus == PaymentStatus.PAID else None,
            )
            db.session.add(p)

        # Overdue loan
        e2e_loan2 = Loan(
            creditor_id=e2e_creditor.id,
            borrower_id=e2e_borrower.id,
            description="Emergency fund loan",
            principal=Decimal("2000.00"),
            interest_rate=Decimal("0.00"),
            repayment_frequency="MONTHLY",
            start_date=today - timedelta(days=90),
            status=LoanStatus.OVERDUE,
        )
        db.session.add(e2e_loan2)
        db.session.flush()

        for i in range(10):
            due = e2e_loan2.start_date + timedelta(days=30 * (i + 1))
            if i < 1:
                pstatus = PaymentStatus.PAID
            elif due < today:
                pstatus = PaymentStatus.OVERDUE
            else:
                pstatus = PaymentStatus.SCHEDULED
            p = Payment(
                loan_id=e2e_loan2.id,
                amount_due=Decimal("200.00"),
                amount_paid=Decimal("200.00") if pstatus == PaymentStatus.PAID else Decimal("0"),
                due_date=due,
                status=pstatus,
                paid_date=due if pstatus == PaymentStatus.PAID else None,
            )
            db.session.add(p)

        # Paid-off loan
        e2e_loan3 = Loan(
            creditor_id=e2e_creditor.id,
            borrower_id=e2e_borrower.id,
            description="Short-term bridge loan",
            principal=Decimal("1000.00"),
            interest_rate=Decimal("0.00"),
            repayment_frequency="MONTHLY",
            start_date=today - timedelta(days=120),
            status=LoanStatus.PAID_OFF,
        )
        db.session.add(e2e_loan3)
        db.session.flush()

        for i in range(4):
            due = e2e_loan3.start_date + timedelta(days=30 * (i + 1))
            p = Payment(
                loan_id=e2e_loan3.id,
                amount_due=Decimal("250.00"),
                amount_paid=Decimal("250.00"),
                due_date=due,
                status=PaymentStatus.PAID,
                paid_date=due,
            )
            db.session.add(p)

        # Notifications for e2e users
        db.session.add(
            Notification(
                user_id=e2e_borrower.id,
                type=NotificationType.PAYMENT_DUE,
                message="Payment of $440.00 is due in 3 days",
                loan_id=e2e_loan1.id,
            )
        )
        db.session.add(
            Notification(
                user_id=e2e_borrower.id,
                type=NotificationType.SYSTEM,
                message="Welcome to LendQ!",
            )
        )
        db.session.add(
            Notification(
                user_id=e2e_creditor.id,
                type=NotificationType.PAYMENT_RECEIVED,
                message="Payment of $440.00 received from Sarah Williams",
                loan_id=e2e_loan1.id,
            )
        )
        db.session.add(
            Notification(
                user_id=e2e_creditor.id,
                type=NotificationType.PAYMENT_OVERDUE,
                message="Payment overdue for Emergency fund loan",
                loan_id=e2e_loan2.id,
            )
        )
        print("  Created e2e demo loans, payments, and notifications for @family.com users")

    db.session.commit()
    print("  Created demo loans, payments, and notifications")
    print("Demo seed complete.")


def main():
    parser = argparse.ArgumentParser(description="Seed LendQ database")
    parser.add_argument("--profile", choices=["baseline", "demo"], default="baseline")
    args = parser.parse_args()

    app = create_app()
    with app.app_context():
        print(f"Seeding with profile: {args.profile}")
        if args.profile == "baseline":
            seed_baseline()
        elif args.profile == "demo":
            seed_demo()


if __name__ == "__main__":
    main()

import logging
from decimal import Decimal

from app.errors.exceptions import AuthorizationError, NotFoundError, ValidationError
from app.extensions import db
from app.models.loan import Loan, LoanStatus
from app.repositories.loan_repository import LoanRepository
from app.repositories.user_repository import UserRepository
from app.services.activity_service import ActivityService
from app.services.audit_service import AuditService
from app.services.notification_service import NotificationService
from app.services.schedule_service import ScheduleService

logger = logging.getLogger(__name__)


class LoanService:
    def __init__(self):
        self.loan_repo = LoanRepository()
        self.user_repo = UserRepository()
        self.schedule_service = ScheduleService()
        self.notification_service = NotificationService()
        self.activity_service = ActivityService()
        self.audit_service = AuditService()

    def list_loans(self, user, page=1, per_page=20, tab=None, status=None):
        if user.has_role("Admin"):
            return self.loan_repo.get_paginated(
                page=page, per_page=per_page,
                filters=[Loan.status == status] if status else None,
                order_by=Loan.created_at.desc(),
            )
        if tab == "creditor" or (not tab and user.has_role("Creditor")):
            return self.loan_repo.get_by_creditor(user.id, page=page, per_page=per_page, status=status)
        return self.loan_repo.get_by_borrower(user.id, page=page, per_page=per_page, status=status)

    def get_loan(self, loan_id, user):
        loan = self.loan_repo.get_by_id(loan_id)
        if not loan:
            raise NotFoundError("Loan not found")
        if not user.has_role("Admin") and loan.creditor_id != user.id and loan.borrower_id != user.id:
            raise AuthorizationError("You do not have access to this loan")
        return loan

    def create_loan(self, data, user):
        if not user.has_role("Creditor") and not user.has_role("Admin"):
            raise AuthorizationError("Only creditors can create loans")

        borrower = self.user_repo.get_by_id(data["borrower_id"])
        if not borrower or not borrower.has_role("Borrower"):
            raise ValidationError("Invalid borrower")

        principal = Decimal(str(data["principal"]))
        if principal <= 0:
            raise ValidationError("Principal must be greater than zero")

        loan = Loan(
            creditor_id=user.id,
            borrower_id=data["borrower_id"],
            description=data["description"],
            principal=principal,
            interest_rate=Decimal(str(data.get("interest_rate", "0.00"))),
            repayment_frequency=data["repayment_frequency"],
            start_date=data["start_date"],
            notes=data.get("notes"),
        )
        self.loan_repo.create(loan)
        db.session.flush()

        loan._num_payments = data["num_payments"]
        payments = self.schedule_service.generate_schedule(loan)
        for payment in payments:
            db.session.add(payment)

        self.activity_service.log_activity(
            user_id=user.id,
            event_type="LOAN_CREATED",
            description=f"Created loan for {borrower.name}: ${principal}",
            loan_id=loan.id,
        )
        self.notification_service.notify_loan_created(loan)
        self.audit_service.log("CREATE", "Loan", loan.id, actor_id=user.id)

        db.session.commit()
        logger.info("Loan created: %s by %s", loan.id, user.id)
        return loan

    def update_loan(self, loan_id, data, user):
        loan = self.get_loan(loan_id, user)

        if loan.borrower_id == user.id and not user.has_role("Admin"):
            if "principal" in data:
                raise AuthorizationError("Borrowers cannot modify the principal")

        changes = {}
        for field in ["description", "interest_rate", "repayment_frequency", "start_date", "status", "notes", "principal"]:
            if field in data:
                old_val = str(getattr(loan, field))
                new_val = str(data[field])
                if old_val != new_val:
                    changes[field] = (old_val, new_val)
                    setattr(loan, field, data[field])

        if changes:
            from app.services.change_log_service import ChangeLogService
            change_log_service = ChangeLogService()
            for field, (old_val, new_val) in changes.items():
                change_log_service.log_change(
                    entity_type="Loan", entity_id=loan.id,
                    field_name=field, old_value=old_val, new_value=new_val,
                    changed_by=user.id,
                )

            self.activity_service.log_activity(
                user_id=user.id,
                event_type="LOAN_MODIFIED",
                description=f"Modified loan: {', '.join(changes.keys())}",
                loan_id=loan.id,
            )
            self.notification_service.notify_loan_modified(loan, user.id)

        db.session.commit()
        logger.info("Loan updated: %s by %s", loan.id, user.id)
        return loan

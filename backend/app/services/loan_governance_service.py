import logging
from datetime import datetime, timezone

from app.errors.exceptions import AuthorizationError, ConflictError, NotFoundError, ValidationError
from app.extensions import db
from app.models.loan_change_request import ChangeRequestStatus, LoanChangeRequest
from app.models.loan_terms_version import LoanTermsVersion
from app.repositories.loan_repository import LoanRepository
from app.services.authorization import assert_loan_participant

logger = logging.getLogger(__name__)


class LoanGovernanceService:
    def __init__(self):
        self.loan_repo = LoanRepository()

    def get_terms_versions(self, loan_id, user):
        loan = self.loan_repo.get_by_id(loan_id)
        if not loan:
            raise NotFoundError("Loan not found")
        assert_loan_participant(loan, user)
        return LoanTermsVersion.query.filter_by(loan_id=loan_id).order_by(
            LoanTermsVersion.version.desc()
        ).all()

    def get_change_requests(self, loan_id, user):
        loan = self.loan_repo.get_by_id(loan_id)
        if not loan:
            raise NotFoundError("Loan not found")
        assert_loan_participant(loan, user)
        return LoanChangeRequest.query.filter_by(loan_id=loan_id).order_by(
            LoanChangeRequest.created_at.desc()
        ).all()

    def create_change_request(self, loan_id, data, user):
        loan = self.loan_repo.get_by_id(loan_id)
        if not loan:
            raise NotFoundError("Loan not found")

        if loan.borrower_id != user.id:
            raise AuthorizationError("Only the borrower can submit change requests")

        request = LoanChangeRequest(
            loan_id=loan_id,
            requested_by=user.id,
            type=data["type"],
            reason=data.get("reason"),
            proposed_changes=data.get("proposed_changes"),
        )
        db.session.add(request)
        db.session.commit()

        logger.info("Change request created for loan %s by %s", loan_id, user.id)
        return request

    def approve_change_request(self, loan_id, request_id, user):
        loan = self.loan_repo.get_by_id(loan_id)
        if not loan:
            raise NotFoundError("Loan not found")

        if loan.creditor_id != user.id and not user.has_role("Admin"):
            raise AuthorizationError("Only the creditor can approve change requests")

        change_request = LoanChangeRequest.query.filter_by(
            id=request_id, loan_id=loan_id
        ).first()
        if not change_request:
            raise NotFoundError("Change request not found")

        if change_request.status != ChangeRequestStatus.PENDING:
            return change_request  # Idempotent

        # Create new terms version from proposed changes
        current_version = loan.current_terms_version
        new_version_num = (current_version.version + 1) if current_version else 1

        proposed = change_request.proposed_changes or {}
        new_terms = LoanTermsVersion(
            loan_id=loan_id,
            version=new_version_num,
            principal_amount=proposed.get("principal_amount", current_version.principal_amount if current_version else loan.principal),
            currency=proposed.get("currency", current_version.currency if current_version else "USD"),
            interest_rate_percent=proposed.get("interest_rate_percent", current_version.interest_rate_percent if current_version else loan.interest_rate),
            repayment_frequency=proposed.get("repayment_frequency", current_version.repayment_frequency if current_version else loan.repayment_frequency),
            installment_count=proposed.get("installment_count", current_version.installment_count if current_version else None),
            maturity_date=proposed.get("maturity_date", current_version.maturity_date if current_version else None),
            start_date=proposed.get("start_date", current_version.start_date if current_version else loan.start_date),
            creditor_notes=proposed.get("creditor_notes"),
            created_by=user.id,
        )
        db.session.add(new_terms)
        db.session.flush()

        change_request.status = ChangeRequestStatus.APPROVED
        change_request.resolved_at = datetime.now(timezone.utc)
        change_request.resolved_by = user.id
        change_request.outcome_terms_version_id = new_terms.id

        loan.current_terms_version_id = new_terms.id
        db.session.commit()

        logger.info("Change request %s approved for loan %s", request_id, loan_id)
        return change_request

    def reject_change_request(self, loan_id, request_id, user):
        loan = self.loan_repo.get_by_id(loan_id)
        if not loan:
            raise NotFoundError("Loan not found")

        if loan.creditor_id != user.id and not user.has_role("Admin"):
            raise AuthorizationError("Only the creditor can reject change requests")

        change_request = LoanChangeRequest.query.filter_by(
            id=request_id, loan_id=loan_id
        ).first()
        if not change_request:
            raise NotFoundError("Change request not found")

        if change_request.status != ChangeRequestStatus.PENDING:
            return change_request  # Idempotent

        change_request.status = ChangeRequestStatus.REJECTED
        change_request.resolved_at = datetime.now(timezone.utc)
        change_request.resolved_by = user.id
        db.session.commit()

        logger.info("Change request %s rejected for loan %s", request_id, loan_id)
        return change_request

from sqlalchemy import or_

from app.models.loan import Loan
from app.repositories.base import BaseRepository


class LoanRepository(BaseRepository):
    model = Loan

    def get_by_creditor(self, creditor_id, page=1, per_page=20, status=None):
        query = Loan.query.filter_by(creditor_id=creditor_id)
        if status:
            query = query.filter_by(status=status)
        query = query.order_by(Loan.created_at.desc())
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        return {
            "items": pagination.items,
            "total": pagination.total,
            "page": pagination.page,
            "per_page": pagination.per_page,
            "pages": pagination.pages,
        }

    def get_by_borrower(self, borrower_id, page=1, per_page=20, status=None):
        query = Loan.query.filter_by(borrower_id=borrower_id)
        if status:
            query = query.filter_by(status=status)
        query = query.order_by(Loan.created_at.desc())
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        return {
            "items": pagination.items,
            "total": pagination.total,
            "page": pagination.page,
            "per_page": pagination.per_page,
            "pages": pagination.pages,
        }

    def get_by_user(self, user_id, page=1, per_page=20, status=None):
        query = Loan.query.filter(
            or_(Loan.creditor_id == user_id, Loan.borrower_id == user_id)
        )
        if status:
            query = query.filter_by(status=status)
        query = query.order_by(Loan.created_at.desc())
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        return {
            "items": pagination.items,
            "total": pagination.total,
            "page": pagination.page,
            "per_page": pagination.per_page,
            "pages": pagination.pages,
        }

    def get_active_loans_as_creditor(self, user_id):
        return Loan.query.filter_by(
            creditor_id=user_id, status="ACTIVE"
        ).all()

    def get_active_loans_as_borrower(self, user_id):
        return Loan.query.filter_by(
            borrower_id=user_id, status="ACTIVE"
        ).all()

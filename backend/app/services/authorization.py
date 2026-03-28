from app.errors.exceptions import AuthorizationError, NotFoundError
from app.repositories.loan_repository import LoanRepository


def assert_loan_participant(loan, user):
    """Verify the user is a creditor, borrower, or admin for this loan.

    Raises AuthorizationError if the user has no relationship to the loan.
    """
    if user.has_role("Admin"):
        return

    if loan.creditor_id == user.id or loan.borrower_id == user.id:
        return

    raise AuthorizationError("You do not have access to this loan")


def load_loan_and_assert_participant(loan_id, user):
    """Load a loan by ID and verify the user is a participant.

    Returns the loan or raises NotFoundError/AuthorizationError.
    """
    loan_repo = LoanRepository()
    loan = loan_repo.get_by_id(loan_id)
    if not loan:
        raise NotFoundError("Loan not found")
    assert_loan_participant(loan, user)
    return loan

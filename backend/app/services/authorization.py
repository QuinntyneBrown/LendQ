from __future__ import annotations

from app.errors.exceptions import AuthorizationError, NotFoundError
from app.models.loan import Loan
from app.models.user import User
from app.repositories.loan_repository import LoanRepository


def assert_loan_participant(loan: Loan, user: User) -> None:
    """Verify the user is a creditor, borrower, or admin for this loan.

    Args:
        loan: The Loan instance to check access for.
        user: The user requesting access.

    Raises:
        AuthorizationError: If the user has no relationship to the loan.
    """
    if user.has_role("Admin"):
        return

    if loan.creditor_id == user.id or loan.borrower_id == user.id:
        return

    raise AuthorizationError("You do not have access to this loan")


def load_loan_and_assert_participant(loan_id: str, user: User) -> Loan:
    """Load a loan by ID and verify the user is a participant.

    Args:
        loan_id: The loan's unique identifier.
        user: The user requesting access.

    Returns:
        The loaded Loan instance.

    Raises:
        NotFoundError: If the loan does not exist.
        AuthorizationError: If the user is not a loan participant.
    """
    loan_repo = LoanRepository()
    loan = loan_repo.get_by_id(loan_id)
    if not loan:
        raise NotFoundError("Loan not found")
    assert_loan_participant(loan, user)
    return loan

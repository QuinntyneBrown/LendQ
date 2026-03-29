from __future__ import annotations

import logging

from sqlalchemy import text

from app.errors.exceptions import AuthorizationError, ConflictError, NotFoundError
from app.extensions import db
from app.models.user import User
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository
from app.services.audit_service import AuditService
from app.services.password_service import PasswordService

logger = logging.getLogger(__name__)

PROTECTED_EMAILS = {"admin@family.com", "creditor@family.com", "borrower@family.com"}
TEST_PATTERNS = ["test", "e2e"]
TEST_DOMAINS = ["@family.com", "@lendq.local"]


def _is_test_user(email: str) -> bool:
    """Return True if the email belongs to a test user (and is not a protected seed user)."""
    email_lower = email.lower()
    if email_lower in PROTECTED_EMAILS:
        return False
    for pattern in TEST_PATTERNS:
        if pattern in email_lower:
            return True
    for domain in TEST_DOMAINS:
        if email_lower.endswith(domain):
            return True
    return False


class UserService:
    def __init__(self) -> None:
        """Initialize UserService with required repositories and services."""
        self.user_repo = UserRepository()
        self.role_repo = RoleRepository()
        self.password_service = PasswordService()
        self.audit_service = AuditService()

    def list_users(
        self,
        page: int = 1,
        per_page: int = 20,
        search: str | None = None,
        role: str | None = None,
        is_active: bool | None = None,
    ) -> dict:
        """List users with optional filtering and pagination.

        Args:
            page: Page number (1-indexed).
            per_page: Number of results per page.
            search: Optional search string for name/email.
            role: Optional role name filter.
            is_active: Optional active-status filter.

        Returns:
            A paginated result dict.
        """
        return self.user_repo.search(
            query_str=search, page=page, per_page=per_page, role=role, is_active=is_active
        )

    def get_user(self, user_id: str) -> User:
        """Fetch a user by ID.

        Raises:
            NotFoundError: If no user exists with the given ID.
        """
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        return user

    def create_user(self, data: dict, actor_id: str | None = None) -> User:
        """Create a new user with roles and an audit log entry.

        Args:
            data: Validated user creation payload (name, email, password, role_ids).
            actor_id: The ID of the admin performing the action.

        Returns:
            The newly created User instance.

        Raises:
            ConflictError: If a user with the given email already exists.
        """
        existing = self.user_repo.get_by_email(data["email"])
        if existing:
            raise ConflictError("A user with this email already exists")

        password_hash = self.password_service.hash_password(data["password"])
        user = User(
            name=data["name"],
            email=data["email"],
            password_hash=password_hash,
        )

        for role_id in data.get("role_ids", []):
            role = self.role_repo.get_by_id(role_id)
            if role:
                user.roles.append(role)

        if not user.roles:
            borrower = self.role_repo.get_by_name("Borrower")
            if borrower:
                user.roles.append(borrower)

        self.user_repo.create(user)
        self.audit_service.log(
            "CREATE",
            "User",
            user.id,
            actor_id=actor_id,
            after_value={
                "name": user.name,
                "email": user.email,
                "roles": user.role_names,
            },
        )
        db.session.commit()
        logger.info("User created: %s by %s", user.id, actor_id)
        return user

    def update_user(self, user_id: str, data: dict, actor_id: str | None = None) -> User:
        """Update an existing user's profile and roles.

        Args:
            user_id: The ID of the user to update.
            data: Validated update payload (name, email, is_active, role_ids).
            actor_id: The ID of the admin performing the action.

        Returns:
            The updated User instance.

        Raises:
            NotFoundError: If no user exists with the given ID.
            ConflictError: If the new email is already in use.
        """
        user = self.get_user(user_id)
        before = {"name": user.name, "email": user.email, "is_active": user.is_active}

        if "email" in data and data["email"] != user.email:
            existing = self.user_repo.get_by_email(data["email"])
            if existing:
                raise ConflictError("A user with this email already exists")
            user.email = data["email"]

        if "name" in data:
            user.name = data["name"]
        if "is_active" in data:
            user.is_active = data["is_active"]
        if "role_ids" in data:
            user.roles = []
            for role_id in data["role_ids"]:
                role = self.role_repo.get_by_id(role_id)
                if role:
                    user.roles.append(role)

        self.audit_service.log(
            "UPDATE",
            "User",
            user.id,
            actor_id=actor_id,
            before_value=before,
            after_value={"name": user.name, "email": user.email, "is_active": user.is_active},
        )
        db.session.commit()
        logger.info("User updated: %s by %s", user.id, actor_id)
        return user

    def delete_user(self, user_id: str, actor_id: str | None = None) -> None:
        """Soft-delete a user by deactivating their account.

        Args:
            user_id: The ID of the user to deactivate.
            actor_id: The ID of the admin performing the action.

        Raises:
            NotFoundError: If no user exists with the given ID.
        """
        user = self.get_user(user_id)
        user.is_active = False
        self.audit_service.log("DEACTIVATE", "User", user.id, actor_id=actor_id)
        db.session.commit()
        logger.info("User deactivated: %s by %s", user.id, actor_id)

    def purge_user(self, user_id: str, actor_id: str | None = None, force: bool = False) -> None:
        """Permanently delete a user and ALL associated data.

        By default only works for test users. Set force=True to bypass
        the test-user check (used by seed_cleanup).

        Args:
            user_id: The ID of the user to permanently delete.
            actor_id: The ID of the admin performing the action.
            force: If True, skip the test-user email check.

        Raises:
            NotFoundError: If no user exists with the given ID.
            AuthorizationError: If the user is not a test user (and force=False).
        """
        user = self.get_user(user_id)

        if not force and not _is_test_user(user.email):
            raise AuthorizationError("Only test users can be permanently deleted")

        uid = user.id

        try:
            # --- Collect related IDs ---
            account_ids = [
                row[0]
                for row in db.session.execute(
                    text("SELECT id FROM bank_accounts WHERE user_id = :uid"),
                    {"uid": uid},
                ).fetchall()
            ]

            loan_ids = [
                row[0]
                for row in db.session.execute(
                    text(
                        "SELECT id FROM loans WHERE creditor_id = :uid OR borrower_id = :uid"
                    ),
                    {"uid": uid},
                ).fetchall()
            ]

            recurring_loan_ids = [
                row[0]
                for row in db.session.execute(
                    text(
                        "SELECT id FROM recurring_loans "
                        "WHERE creditor_id = :uid OR borrower_id = :uid"
                    ),
                    {"uid": uid},
                ).fetchall()
            ]

            savings_goal_ids = [
                row[0]
                for row in db.session.execute(
                    text("SELECT id FROM savings_goals WHERE user_id = :uid"),
                    {"uid": uid},
                ).fetchall()
            ]

            notification_ids = [
                row[0]
                for row in db.session.execute(
                    text("SELECT id FROM notifications WHERE user_id = :uid"),
                    {"uid": uid},
                ).fetchall()
            ]

            # Collect schedule_version IDs for the loans
            schedule_version_ids = []
            if loan_ids:
                schedule_version_ids = [
                    row[0]
                    for row in db.session.execute(
                        text(
                            "SELECT id FROM schedule_versions WHERE loan_id IN :loan_ids"
                        ),
                        {"loan_ids": tuple(loan_ids)},
                    ).fetchall()
                ]

            # Collect payment_transaction IDs for the loans
            payment_transaction_ids = []
            if loan_ids:
                payment_transaction_ids = [
                    row[0]
                    for row in db.session.execute(
                        text(
                            "SELECT id FROM payment_transactions WHERE loan_id IN :loan_ids"
                        ),
                        {"loan_ids": tuple(loan_ids)},
                    ).fetchall()
                ]

            # Collect schedule_installment IDs
            schedule_installment_ids = []
            if schedule_version_ids:
                schedule_installment_ids = [
                    row[0]
                    for row in db.session.execute(
                        text(
                            "SELECT id FROM schedule_installments "
                            "WHERE schedule_version_id IN :sv_ids"
                        ),
                        {"sv_ids": tuple(schedule_version_ids)},
                    ).fetchall()
                ]

            # Collect recurring_loan_template_version IDs
            template_version_ids = []
            if recurring_loan_ids:
                template_version_ids = [
                    row[0]
                    for row in db.session.execute(
                        text(
                            "SELECT id FROM recurring_loan_template_versions "
                            "WHERE recurring_loan_id IN :rl_ids"
                        ),
                        {"rl_ids": tuple(recurring_loan_ids)},
                    ).fetchall()
                ]

            # =====================================================
            # DELETE deepest children first, respecting FK order
            # =====================================================

            # 1. SavingsGoalEntries (via savings_goals)
            if savings_goal_ids:
                db.session.execute(
                    text(
                        "DELETE FROM savings_goal_entries WHERE goal_id IN :ids"
                    ),
                    {"ids": tuple(savings_goal_ids)},
                )

            # 2. NotificationDeliveries (via notifications)
            if notification_ids:
                db.session.execute(
                    text(
                        "DELETE FROM notification_deliveries "
                        "WHERE notification_id IN :ids"
                    ),
                    {"ids": tuple(notification_ids)},
                )

            # 3. PaymentAllocations (via payment_transactions)
            if payment_transaction_ids:
                db.session.execute(
                    text(
                        "DELETE FROM payment_allocations "
                        "WHERE transaction_id IN :ids"
                    ),
                    {"ids": tuple(payment_transaction_ids)},
                )

            # 4. PaymentTransactions — nullify created_by, then delete by loan
            db.session.execute(
                text(
                    "UPDATE payment_transactions SET created_by = NULL "
                    "WHERE created_by = :uid"
                ),
                {"uid": uid},
            )
            if loan_ids:
                db.session.execute(
                    text(
                        "DELETE FROM payment_transactions WHERE loan_id IN :ids"
                    ),
                    {"ids": tuple(loan_ids)},
                )

            # 5. ScheduleInstallments (via schedule_versions)
            if schedule_version_ids:
                db.session.execute(
                    text(
                        "DELETE FROM schedule_installments "
                        "WHERE schedule_version_id IN :ids"
                    ),
                    {"ids": tuple(schedule_version_ids)},
                )

            # 6. ScheduleAdjustmentEvents — references schedule_versions + actor
            if loan_ids:
                db.session.execute(
                    text(
                        "DELETE FROM schedule_adjustment_events "
                        "WHERE loan_id IN :ids"
                    ),
                    {"ids": tuple(loan_ids)},
                )
            db.session.execute(
                text(
                    "DELETE FROM schedule_adjustment_events WHERE actor_id = :uid"
                ),
                {"uid": uid},
            )

            # 7. Clear the FK pointers on Loans before deleting schedule_versions
            if loan_ids:
                db.session.execute(
                    text(
                        "UPDATE loans SET current_schedule_version_id = NULL, "
                        "current_terms_version_id = NULL "
                        "WHERE id IN :ids"
                    ),
                    {"ids": tuple(loan_ids)},
                )

            # 8. ScheduleVersions (via loans)
            if loan_ids:
                db.session.execute(
                    text(
                        "DELETE FROM schedule_versions WHERE loan_id IN :ids"
                    ),
                    {"ids": tuple(loan_ids)},
                )

            # 9. Payments (via loans)
            if loan_ids:
                db.session.execute(
                    text("DELETE FROM payments WHERE loan_id IN :ids"),
                    {"ids": tuple(loan_ids)},
                )

            # 10. LoanChangeRequests — has FK to loan_terms_versions, must
            #     be deleted before loan_terms_versions
            db.session.execute(
                text(
                    "UPDATE loan_change_requests SET resolved_by = NULL "
                    "WHERE resolved_by = :uid"
                ),
                {"uid": uid},
            )
            if loan_ids:
                db.session.execute(
                    text(
                        "DELETE FROM loan_change_requests WHERE loan_id IN :ids"
                    ),
                    {"ids": tuple(loan_ids)},
                )
            db.session.execute(
                text(
                    "DELETE FROM loan_change_requests WHERE requested_by = :uid"
                ),
                {"uid": uid},
            )

            # 11. LoanTermsVersions — nullify created_by, then delete by loan
            db.session.execute(
                text(
                    "UPDATE loan_terms_versions SET created_by = NULL "
                    "WHERE created_by = :uid"
                ),
                {"uid": uid},
            )
            if loan_ids:
                db.session.execute(
                    text(
                        "DELETE FROM loan_terms_versions WHERE loan_id IN :ids"
                    ),
                    {"ids": tuple(loan_ids)},
                )

            # 12. GeneratedLoanRecords (via recurring_loans and via loans)
            if recurring_loan_ids:
                db.session.execute(
                    text(
                        "DELETE FROM generated_loan_records "
                        "WHERE recurring_loan_id IN :ids"
                    ),
                    {"ids": tuple(recurring_loan_ids)},
                )
            if loan_ids:
                db.session.execute(
                    text(
                        "DELETE FROM generated_loan_records "
                        "WHERE loan_id IN :ids"
                    ),
                    {"ids": tuple(loan_ids)},
                )

            # 13. RecurringLoanConsents (via recurring_loans + user)
            if recurring_loan_ids:
                db.session.execute(
                    text(
                        "DELETE FROM recurring_loan_consents "
                        "WHERE recurring_loan_id IN :ids"
                    ),
                    {"ids": tuple(recurring_loan_ids)},
                )
            db.session.execute(
                text(
                    "DELETE FROM recurring_loan_consents "
                    "WHERE decided_by_user_id = :uid"
                ),
                {"uid": uid},
            )

            # 14. Clear active_template_version_id FK on recurring_loans before
            #     deleting template versions
            if recurring_loan_ids:
                db.session.execute(
                    text(
                        "UPDATE recurring_loans "
                        "SET active_template_version_id = NULL "
                        "WHERE id IN :ids"
                    ),
                    {"ids": tuple(recurring_loan_ids)},
                )

            # 15. RecurringLoanTemplateVersions (via recurring_loans)
            if recurring_loan_ids:
                db.session.execute(
                    text(
                        "DELETE FROM recurring_loan_template_versions "
                        "WHERE recurring_loan_id IN :ids"
                    ),
                    {"ids": tuple(recurring_loan_ids)},
                )

            # 16. RecurringLoans (creditor or borrower)
            db.session.execute(
                text(
                    "DELETE FROM recurring_loans "
                    "WHERE creditor_id = :uid OR borrower_id = :uid"
                ),
                {"uid": uid},
            )

            # 17. Notifications — user's own + any referencing the user's loans
            #     (notification has FK to loans via loan_id / related_loan_id)
            db.session.execute(
                text("DELETE FROM notifications WHERE user_id = :uid"),
                {"uid": uid},
            )
            if loan_ids:
                db.session.execute(
                    text(
                        "UPDATE notifications SET loan_id = NULL "
                        "WHERE loan_id IN :ids"
                    ),
                    {"ids": tuple(loan_ids)},
                )
                db.session.execute(
                    text(
                        "UPDATE notifications SET related_loan_id = NULL "
                        "WHERE related_loan_id IN :ids"
                    ),
                    {"ids": tuple(loan_ids)},
                )

            # 18. ActivityItems (has FK to loans via loan_id)
            db.session.execute(
                text("DELETE FROM activity_items WHERE user_id = :uid"),
                {"uid": uid},
            )
            if loan_ids:
                db.session.execute(
                    text(
                        "DELETE FROM activity_items WHERE loan_id IN :ids"
                    ),
                    {"ids": tuple(loan_ids)},
                )

            # 19. IdempotencyRecords (has FK to loans via loan_id)
            db.session.execute(
                text(
                    "DELETE FROM idempotency_records WHERE user_id = :uid"
                ),
                {"uid": uid},
            )
            if loan_ids:
                db.session.execute(
                    text(
                        "DELETE FROM idempotency_records WHERE loan_id IN :ids"
                    ),
                    {"ids": tuple(loan_ids)},
                )

            # 20. Loans (creditor or borrower)
            db.session.execute(
                text(
                    "DELETE FROM loans "
                    "WHERE creditor_id = :uid OR borrower_id = :uid"
                ),
                {"uid": uid},
            )

            # 21. BankTransactions — delete by account + initiated_by
            if account_ids:
                db.session.execute(
                    text(
                        "DELETE FROM bank_transactions WHERE account_id IN :ids"
                    ),
                    {"ids": tuple(account_ids)},
                )
            db.session.execute(
                text(
                    "DELETE FROM bank_transactions "
                    "WHERE initiated_by_user_id = :uid"
                ),
                {"uid": uid},
            )

            # 22. RecurringDeposits (via accounts + owner)
            if account_ids:
                db.session.execute(
                    text(
                        "DELETE FROM recurring_deposits WHERE account_id IN :ids"
                    ),
                    {"ids": tuple(account_ids)},
                )
            db.session.execute(
                text(
                    "DELETE FROM recurring_deposits WHERE owner_user_id = :uid"
                ),
                {"uid": uid},
            )

            # 23. SavingsGoals (user_id)
            db.session.execute(
                text("DELETE FROM savings_goals WHERE user_id = :uid"),
                {"uid": uid},
            )

            # 24. BankAccounts (user_id)
            db.session.execute(
                text("DELETE FROM bank_accounts WHERE user_id = :uid"),
                {"uid": uid},
            )

            # 25. EmailVerificationTokens (user_id)
            db.session.execute(
                text(
                    "DELETE FROM email_verification_tokens WHERE user_id = :uid"
                ),
                {"uid": uid},
            )

            # 26. PasswordResetTokens (user_id)
            db.session.execute(
                text(
                    "DELETE FROM password_reset_tokens WHERE user_id = :uid"
                ),
                {"uid": uid},
            )

            # 27. NotificationPreferences (user_id)
            db.session.execute(
                text(
                    "DELETE FROM notification_preferences WHERE user_id = :uid"
                ),
                {"uid": uid},
            )

            # 28. AuthSessions (user_id)
            db.session.execute(
                text("DELETE FROM auth_sessions WHERE user_id = :uid"),
                {"uid": uid},
            )

            # --- Nullable FK columns: set to NULL instead of deleting ---

            # 29. ChangeLog entries (changed_by)
            db.session.execute(
                text(
                    "UPDATE change_logs SET changed_by = NULL "
                    "WHERE changed_by = :uid"
                ),
                {"uid": uid},
            )

            # 30. AuditLog entries (actor_id)
            db.session.execute(
                text(
                    "UPDATE audit_logs SET actor_id = NULL "
                    "WHERE actor_id = :uid"
                ),
                {"uid": uid},
            )

            # 31. SecurityAuditEvents (user_id)
            db.session.execute(
                text(
                    "UPDATE security_audit_events SET user_id = NULL "
                    "WHERE user_id = :uid"
                ),
                {"uid": uid},
            )

            # 32. user_roles (association table)
            db.session.execute(
                text("DELETE FROM user_roles WHERE user_id = :uid"),
                {"uid": uid},
            )

            # 33. Finally: delete the User record itself
            db.session.execute(
                text("DELETE FROM users WHERE id = :uid"),
                {"uid": uid},
            )

            db.session.commit()
            logger.info(
                "User permanently purged: %s by %s", uid, actor_id
            )

        except Exception:
            db.session.rollback()
            logger.exception("Failed to purge user %s", uid)
            raise

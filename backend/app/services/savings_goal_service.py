from __future__ import annotations

import hashlib
import logging
from decimal import Decimal

from app.errors.exceptions import AuthorizationError, ConflictError, NotFoundError, ValidationError
from app.extensions import db
from app.models.bank_account import BankAccountStatus
from app.models.bank_transaction import BankTransaction, BankTransactionDirection, BankTransactionEntryType
from app.models.outbox_event import OutboxEvent
from app.models.savings_goal import SavingsGoal, SavingsGoalStatus
from app.models.savings_goal_entry import (
    SavingsGoalEntry,
    SavingsGoalEntryDirection,
    SavingsGoalEntryType,
)
from app.repositories.bank_account_repository import BankAccountRepository, BankTransactionRepository
from app.repositories.savings_goal_repository import SavingsGoalEntryRepository, SavingsGoalRepository
from app.services.audit_service import AuditService

logger = logging.getLogger(__name__)


class SavingsGoalService:
    def __init__(self) -> None:
        self.goal_repo = SavingsGoalRepository()
        self.entry_repo = SavingsGoalEntryRepository()
        self.account_repo = BankAccountRepository()
        self.txn_repo = BankTransactionRepository()
        self.audit_service = AuditService()

    def list_goals(self, user, page: int = 1, per_page: int = 20) -> dict:
        """Return paginated savings goals for the user."""
        return self.goal_repo.get_by_user_paginated(user.id, page=page, per_page=per_page)

    def get_goal(self, goal_id: str, user) -> SavingsGoal:
        """Fetch a goal by ID with ownership check."""
        goal = self.goal_repo.get_by_id(goal_id)
        if not goal:
            raise NotFoundError("Savings goal not found")
        if goal.user_id != user.id:
            raise AuthorizationError("You do not have access to this savings goal")
        return goal

    def create_goal(self, data: dict, user) -> SavingsGoal:
        """Create a new savings goal."""
        goal = SavingsGoal(
            user_id=user.id,
            name=data["name"],
            target_amount=Decimal(str(data["target_amount"])),
            currency=data.get("currency", "USD"),
            deadline=data.get("deadline"),
            description=data.get("description"),
            status=SavingsGoalStatus.IN_PROGRESS,
        )
        self.goal_repo.create(goal)
        self.audit_service.log("CREATE", "SavingsGoal", goal.id, actor_id=user.id)
        db.session.commit()
        logger.info("Savings goal created: %s by %s", goal.id, user.id)
        return goal

    def update_goal(self, goal_id: str, data: dict, user) -> SavingsGoal:
        """Update a savings goal with optimistic locking."""
        goal = self.get_goal(goal_id, user)

        expected_version = data.get("expected_version")
        if expected_version is not None and goal.version != expected_version:
            raise ConflictError("Savings goal has been modified by another request")

        if "target_amount" in data:
            new_target = Decimal(str(data["target_amount"]))
            if new_target < goal.current_amount:
                raise ConflictError(
                    "Target amount cannot be less than current saved amount"
                )

        for field in ["name", "target_amount", "deadline", "description"]:
            if field in data:
                setattr(goal, field, data[field])

        goal.version += 1

        # If target was increased and goal was COMPLETED, revert to IN_PROGRESS
        if goal.status == SavingsGoalStatus.COMPLETED:
            if goal.current_amount < goal.target_amount:
                goal.status = SavingsGoalStatus.IN_PROGRESS

        self.goal_repo.update(goal)
        self.audit_service.log("UPDATE", "SavingsGoal", goal.id, actor_id=user.id)
        db.session.commit()
        logger.info("Savings goal updated: %s by %s", goal.id, user.id)
        return goal

    def cancel_goal(self, goal_id: str, user) -> SavingsGoal:
        """Cancel a savings goal. Requires current_amount == 0."""
        goal = self.get_goal(goal_id, user)

        if goal.current_amount != 0:
            raise ConflictError(
                "Cannot cancel a savings goal with remaining balance. Release funds first."
            )

        goal.status = SavingsGoalStatus.CANCELLED
        goal.version += 1
        self.goal_repo.update(goal)
        self.audit_service.log("CANCEL", "SavingsGoal", goal.id, actor_id=user.id)
        db.session.commit()
        logger.info("Savings goal cancelled: %s by %s", goal.id, user.id)
        return goal

    def contribute(self, goal_id: str, data: dict, user, idempotency_key: str) -> SavingsGoalEntry:
        """Contribute funds from a bank account to a savings goal."""
        key_hash = hashlib.sha256(idempotency_key.encode()).hexdigest()

        # Idempotency dedup
        existing = self.entry_repo.get_by_idempotency_key(key_hash)
        if existing:
            return existing

        amount = Decimal(str(data["amount"]))
        account_id = data["account_id"]

        # Validate goal
        goal = self.get_goal(goal_id, user)
        if goal.status != SavingsGoalStatus.IN_PROGRESS:
            raise ValidationError("Can only contribute to goals that are in progress")

        # Validate account
        account = self.account_repo.get_by_id(account_id)
        if not account:
            raise NotFoundError("Bank account not found")
        if account.user_id != user.id:
            raise AuthorizationError("You do not own this bank account")
        if account.status != BankAccountStatus.ACTIVE:
            raise ValidationError("Bank account is not active")
        if account.current_balance < amount:
            raise ValidationError("Insufficient account balance")

        # Lock in deterministic order (by id) to prevent deadlocks
        ids_sorted = sorted([goal_id, account_id])
        for lock_id in ids_sorted:
            if lock_id == goal_id:
                goal = self.goal_repo.lock_for_update(goal_id)
            else:
                account = self.account_repo.lock_for_update(account_id)

        # Re-check balance after lock
        if account.current_balance < amount:
            raise ValidationError("Insufficient account balance")

        # Create bank transaction (DEBIT from account)
        balance_before = account.current_balance
        balance_after = balance_before - amount
        txn = BankTransaction(
            account_id=account_id,
            direction=BankTransactionDirection.DEBIT,
            entry_type=BankTransactionEntryType.SAVINGS_CONTRIBUTION,
            amount=amount,
            balance_before=balance_before,
            balance_after=balance_after,
            initiated_by_user_id=user.id,
            idempotency_key_hash=key_hash,
            description=f"Savings contribution to '{goal.name}'",
        )
        self.txn_repo.create(txn)

        # Update account balance
        account.current_balance = balance_after
        account.version += 1

        # Create savings goal entry (CREDIT to goal)
        new_current = goal.current_amount + amount
        entry = SavingsGoalEntry(
            goal_id=goal_id,
            direction=SavingsGoalEntryDirection.CREDIT,
            entry_type=SavingsGoalEntryType.CONTRIBUTION,
            amount=amount,
            bank_transaction_id=txn.id,
            running_total=new_current,
            idempotency_key_hash=key_hash,
        )
        self.entry_repo.create(entry)

        # Update goal
        goal.current_amount = new_current
        goal.version += 1

        # Check if target met
        if goal.current_amount >= goal.target_amount:
            goal.status = SavingsGoalStatus.COMPLETED
            self._emit_outbox("SavingsGoal", goal.id, "savings.goal_target_met", {
                "goal_id": goal.id,
                "user_id": user.id,
                "target_amount": str(goal.target_amount),
                "current_amount": str(goal.current_amount),
            })

        self._emit_outbox("SavingsGoal", goal.id, "savings.goal_contributed", {
            "goal_id": goal.id,
            "user_id": user.id,
            "amount": str(amount),
            "current_amount": str(goal.current_amount),
            "entry_id": entry.id,
        })

        self.audit_service.log("CONTRIBUTE", "SavingsGoal", goal.id, actor_id=user.id)
        db.session.commit()
        logger.info("Contribution of %s to goal %s by %s", amount, goal.id, user.id)
        return entry

    def release(self, goal_id: str, data: dict, user, idempotency_key: str) -> SavingsGoalEntry:
        """Release funds from a savings goal back to a bank account."""
        key_hash = hashlib.sha256(idempotency_key.encode()).hexdigest()

        # Idempotency dedup
        existing = self.entry_repo.get_by_idempotency_key(key_hash)
        if existing:
            return existing

        amount = Decimal(str(data["amount"]))
        account_id = data["account_id"]

        # Validate goal
        goal = self.get_goal(goal_id, user)
        if goal.status == SavingsGoalStatus.CANCELLED:
            raise ValidationError("Cannot release from a cancelled goal")
        if amount > goal.current_amount:
            raise ValidationError("Release amount exceeds current savings balance")

        # Validate account
        account = self.account_repo.get_by_id(account_id)
        if not account:
            raise NotFoundError("Bank account not found")
        if account.user_id != user.id:
            raise AuthorizationError("You do not own this bank account")
        if account.status != BankAccountStatus.ACTIVE:
            raise ValidationError("Bank account is not active")

        # Lock in deterministic order
        ids_sorted = sorted([goal_id, account_id])
        for lock_id in ids_sorted:
            if lock_id == goal_id:
                goal = self.goal_repo.lock_for_update(goal_id)
            else:
                account = self.account_repo.lock_for_update(account_id)

        # Re-check balance after lock
        if amount > goal.current_amount:
            raise ValidationError("Release amount exceeds current savings balance")

        was_completed = goal.status == SavingsGoalStatus.COMPLETED

        # Create bank transaction (CREDIT to account)
        balance_before = account.current_balance
        balance_after = balance_before + amount
        txn = BankTransaction(
            account_id=account_id,
            direction=BankTransactionDirection.CREDIT,
            entry_type=BankTransactionEntryType.SAVINGS_RELEASE,
            amount=amount,
            balance_before=balance_before,
            balance_after=balance_after,
            initiated_by_user_id=user.id,
            idempotency_key_hash=key_hash,
            description=f"Savings release from '{goal.name}'",
        )
        self.txn_repo.create(txn)

        # Update account balance
        account.current_balance = balance_after
        account.version += 1

        # Create savings goal entry (DEBIT from goal)
        new_current = goal.current_amount - amount
        entry = SavingsGoalEntry(
            goal_id=goal_id,
            direction=SavingsGoalEntryDirection.DEBIT,
            entry_type=SavingsGoalEntryType.RELEASE,
            amount=amount,
            bank_transaction_id=txn.id,
            running_total=new_current,
            idempotency_key_hash=key_hash,
        )
        self.entry_repo.create(entry)

        # Update goal
        goal.current_amount = new_current
        goal.version += 1

        # Revert status if was completed and now below target
        if was_completed and goal.current_amount < goal.target_amount:
            goal.status = SavingsGoalStatus.IN_PROGRESS

        self._emit_outbox("SavingsGoal", goal.id, "savings.goal_released", {
            "goal_id": goal.id,
            "user_id": user.id,
            "amount": str(amount),
            "current_amount": str(goal.current_amount),
            "entry_id": entry.id,
        })

        self.audit_service.log("RELEASE", "SavingsGoal", goal.id, actor_id=user.id)
        db.session.commit()
        logger.info("Release of %s from goal %s by %s", amount, goal.id, user.id)
        return entry

    def list_entries(self, goal_id: str, user, page: int = 1, per_page: int = 20) -> dict:
        """Return paginated entries for a savings goal."""
        # Ownership check
        self.get_goal(goal_id, user)
        return self.entry_repo.get_by_goal_paginated(goal_id, page=page, per_page=per_page)

    def _emit_outbox(self, aggregate_type: str, aggregate_id: str, event_type: str, payload: dict) -> None:
        """Emit an outbox event for async processing."""
        event = OutboxEvent(
            aggregate_type=aggregate_type,
            aggregate_id=aggregate_id,
            event_type=event_type,
            payload=payload,
        )
        db.session.add(event)
        db.session.flush()

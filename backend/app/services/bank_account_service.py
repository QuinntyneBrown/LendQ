import hashlib
import logging
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from flask import g

from app.errors.exceptions import (
    AuthorizationError,
    ConflictError,
    NotFoundError,
    ValidationError,
)
from app.extensions import db
from app.models.bank_account import BankAccount, BankAccountStatus
from app.models.bank_transaction import (
    BankTransaction,
    BankTransactionDirection,
    BankTransactionEntryType,
)
from app.models.outbox_event import OutboxEvent
from app.models.recurring_deposit import RecurringDeposit, RecurringDepositStatus
from app.repositories.bank_account_repository import (
    BankAccountRepository,
    BankTransactionRepository,
    RecurringDepositRepository,
)
from app.services.audit_service import AuditService

logger = logging.getLogger(__name__)


def _hash_idempotency_key(key):
    return hashlib.sha256(key.encode()).hexdigest()


def _compute_next_execution(frequency, from_date):
    if frequency == "WEEKLY":
        return from_date + timedelta(weeks=1)
    elif frequency == "BIWEEKLY":
        return from_date + timedelta(weeks=2)
    elif frequency == "MONTHLY":
        month = from_date.month % 12 + 1
        year = from_date.year + (1 if from_date.month == 12 else 0)
        day = min(from_date.day, 28)
        return from_date.replace(year=year, month=month, day=day)
    return from_date + timedelta(days=30)


class BankAccountService:
    def __init__(self):
        self.account_repo = BankAccountRepository()
        self.txn_repo = BankTransactionRepository()
        self.recurring_repo = RecurringDepositRepository()
        self.audit_service = AuditService()

    def get_or_create_account(self, user):
        account = self.account_repo.get_by_user_id(user.id)
        if not account:
            account = BankAccount(user_id=user.id, currency="USD")
            self.account_repo.create(account)
            db.session.commit()
        return account

    def get_account(self, account_id, user):
        account = self.account_repo.get_by_id(account_id)
        if not account:
            raise NotFoundError("Bank account not found")
        if not user.has_role("Admin") and account.user_id != user.id:
            raise AuthorizationError("You do not have access to this account")
        return account

    def list_accounts(self, user, page=1, per_page=20):
        if user.has_role("Admin"):
            return self.account_repo.get_paginated(
                page=page, per_page=per_page, order_by=BankAccount.created_at.desc()
            )
        accounts = self.account_repo.get_all_by_user_id(user.id)
        return {
            "items": accounts,
            "total": len(accounts),
            "page": 1,
            "per_page": per_page,
            "pages": 1,
        }

    def deposit(self, account_id, data, user, idempotency_key):
        key_hash = _hash_idempotency_key(idempotency_key)
        existing = self.txn_repo.get_by_idempotency_key(key_hash)
        if existing:
            return existing

        account = self.account_repo.lock_for_update(account_id)
        if not account:
            raise NotFoundError("Bank account not found")
        if account.status != BankAccountStatus.ACTIVE:
            raise ConflictError(f"Account is {account.status}, deposits not allowed")

        amount = Decimal(str(data["amount"]))
        balance_before = account.current_balance
        balance_after = balance_before + amount

        txn = BankTransaction(
            account_id=account.id,
            direction=BankTransactionDirection.CREDIT,
            entry_type=BankTransactionEntryType.MANUAL_DEPOSIT,
            amount=amount,
            balance_before=balance_before,
            balance_after=balance_after,
            reason_code=data.get("reason_code", "MANUAL_DEPOSIT"),
            initiated_by_user_id=user.id,
            idempotency_key_hash=key_hash,
            correlation_id=getattr(g, "request_id", None),
            description=data.get("description"),
        )
        db.session.add(txn)

        account.current_balance = balance_after
        account.version += 1

        outbox = OutboxEvent(
            aggregate_type="BankAccount",
            aggregate_id=account.id,
            event_type="bank_account.deposit_posted",
            payload={
                "account_id": account.id,
                "transaction_id": txn.id,
                "amount": str(amount),
                "balance_after": str(balance_after),
            },
        )
        db.session.add(outbox)

        self.audit_service.log(
            "DEPOSIT", "BankAccount", account.id, actor_id=user.id,
            before_value={"balance": str(balance_before)},
            after_value={"balance": str(balance_after)},
        )

        db.session.commit()
        logger.info("Deposit %s to account %s by %s", amount, account.id, user.id)
        return txn

    def withdraw(self, account_id, data, user, idempotency_key):
        key_hash = _hash_idempotency_key(idempotency_key)
        existing = self.txn_repo.get_by_idempotency_key(key_hash)
        if existing:
            return existing

        account = self.account_repo.lock_for_update(account_id)
        if not account:
            raise NotFoundError("Bank account not found")
        if account.status != BankAccountStatus.ACTIVE:
            raise ConflictError(f"Account is {account.status}, withdrawals not allowed")

        amount = Decimal(str(data["amount"]))
        if account.current_balance < amount:
            raise ConflictError("Insufficient balance")

        balance_before = account.current_balance
        balance_after = balance_before - amount

        txn = BankTransaction(
            account_id=account.id,
            direction=BankTransactionDirection.DEBIT,
            entry_type=BankTransactionEntryType.MANUAL_WITHDRAWAL,
            amount=amount,
            balance_before=balance_before,
            balance_after=balance_after,
            reason_code=data.get("reason_code", "MANUAL_WITHDRAWAL"),
            initiated_by_user_id=user.id,
            idempotency_key_hash=key_hash,
            correlation_id=getattr(g, "request_id", None),
            description=data.get("description"),
        )
        db.session.add(txn)

        account.current_balance = balance_after
        account.version += 1

        outbox = OutboxEvent(
            aggregate_type="BankAccount",
            aggregate_id=account.id,
            event_type="bank_account.withdrawal_posted",
            payload={
                "account_id": account.id,
                "transaction_id": txn.id,
                "amount": str(amount),
                "balance_after": str(balance_after),
            },
        )
        db.session.add(outbox)

        self.audit_service.log(
            "WITHDRAWAL", "BankAccount", account.id, actor_id=user.id,
            before_value={"balance": str(balance_before)},
            after_value={"balance": str(balance_after)},
        )

        db.session.commit()
        logger.info("Withdrawal %s from account %s by %s", amount, account.id, user.id)
        return txn

    def reverse_transaction(self, transaction_id, data, user, idempotency_key):
        key_hash = _hash_idempotency_key(idempotency_key)
        existing = self.txn_repo.get_by_idempotency_key(key_hash)
        if existing:
            return existing

        original_txn = self.txn_repo.get_by_id(transaction_id)
        if not original_txn:
            raise NotFoundError("Transaction not found")

        account = self.account_repo.lock_for_update(original_txn.account_id)
        if not account:
            raise NotFoundError("Bank account not found")

        # Create compensating entry
        if original_txn.direction == BankTransactionDirection.CREDIT:
            reverse_direction = BankTransactionDirection.DEBIT
            balance_after = account.current_balance - original_txn.amount
            if balance_after < 0:
                raise ConflictError("Reversal would create negative balance")
        else:
            reverse_direction = BankTransactionDirection.CREDIT
            balance_after = account.current_balance + original_txn.amount

        balance_before = account.current_balance

        txn = BankTransaction(
            account_id=account.id,
            direction=reverse_direction,
            entry_type=BankTransactionEntryType.REVERSAL,
            amount=original_txn.amount,
            balance_before=balance_before,
            balance_after=balance_after,
            reason_code=data.get("reason_code", "REVERSAL"),
            initiated_by_user_id=user.id,
            idempotency_key_hash=key_hash,
            reversed_transaction_id=original_txn.id,
            correlation_id=getattr(g, "request_id", None),
            description=data.get("description", f"Reversal of transaction {original_txn.id}"),
        )
        db.session.add(txn)

        account.current_balance = balance_after
        account.version += 1

        outbox = OutboxEvent(
            aggregate_type="BankAccount",
            aggregate_id=account.id,
            event_type="bank_account.transaction_reversed",
            payload={
                "account_id": account.id,
                "transaction_id": txn.id,
                "reversed_transaction_id": original_txn.id,
                "amount": str(original_txn.amount),
                "balance_after": str(balance_after),
            },
        )
        db.session.add(outbox)

        self.audit_service.log(
            "REVERSAL", "BankAccount", account.id, actor_id=user.id,
            before_value={"balance": str(balance_before)},
            after_value={"balance": str(balance_after)},
        )

        db.session.commit()
        logger.info("Reversed transaction %s on account %s by %s", original_txn.id, account.id, user.id)
        return txn

    def list_transactions(self, account_id, user, page=1, per_page=20, entry_type=None):
        account = self.get_account(account_id, user)
        return self.txn_repo.get_by_account_paginated(
            account.id, page=page, per_page=per_page, entry_type=entry_type
        )

    # --- Recurring Deposits ---

    def create_recurring_deposit(self, account_id, data, user):
        account = self.get_account(account_id, user)
        if account.status != BankAccountStatus.ACTIVE:
            raise ConflictError("Account must be ACTIVE to create recurring deposit")
        if account.user_id != user.id and not user.has_role("Admin"):
            raise AuthorizationError("Only account owner or admin can create recurring deposits")

        from datetime import datetime, time
        start = data["start_date"]
        exec_time = data.get("execution_time_local", "09:00")
        hour, minute = int(exec_time.split(":")[0]), int(exec_time.split(":")[1])
        next_exec = datetime.combine(start, time(hour, minute)).replace(tzinfo=UTC)

        deposit = RecurringDeposit(
            account_id=account.id,
            owner_user_id=user.id,
            amount=Decimal(str(data["amount"])),
            source_description=data["source_description"],
            frequency=data["frequency"],
            start_date=start,
            end_date=data.get("end_date"),
            execution_time_local=exec_time,
            timezone=data.get("timezone", "UTC"),
            next_execution_at=next_exec,
        )
        self.recurring_repo.create(deposit)

        self.audit_service.log(
            "CREATE", "RecurringDeposit", deposit.id, actor_id=user.id,
        )

        db.session.commit()
        logger.info("Created recurring deposit %s for account %s", deposit.id, account.id)
        return deposit

    def update_recurring_deposit(self, account_id, deposit_id, data, user):
        account = self.get_account(account_id, user)
        deposit = self.recurring_repo.get_by_id(deposit_id)
        if not deposit or deposit.account_id != account.id:
            raise NotFoundError("Recurring deposit not found")
        if deposit.owner_user_id != user.id and not user.has_role("Admin"):
            raise AuthorizationError("Only the owner or admin can update recurring deposits")

        expected_version = data.get("expected_version")
        if expected_version is not None and expected_version != deposit.version:
            raise ConflictError("Stale version; another update has occurred")

        for field in ["amount", "source_description", "frequency", "end_date", "execution_time_local", "timezone"]:
            if field in data and data[field] is not None:
                if field == "amount":
                    setattr(deposit, field, Decimal(str(data[field])))
                else:
                    setattr(deposit, field, data[field])

        deposit.version += 1
        db.session.commit()
        return deposit

    def pause_recurring_deposit(self, account_id, deposit_id, user):
        account = self.get_account(account_id, user)
        deposit = self.recurring_repo.get_by_id(deposit_id)
        if not deposit or deposit.account_id != account.id:
            raise NotFoundError("Recurring deposit not found")
        if deposit.status != RecurringDepositStatus.ACTIVE:
            raise ConflictError("Can only pause an ACTIVE recurring deposit")
        deposit.status = RecurringDepositStatus.PAUSED
        deposit.next_execution_at = None
        deposit.version += 1
        db.session.commit()
        return deposit

    def resume_recurring_deposit(self, account_id, deposit_id, user):
        account = self.get_account(account_id, user)
        deposit = self.recurring_repo.get_by_id(deposit_id)
        if not deposit or deposit.account_id != account.id:
            raise NotFoundError("Recurring deposit not found")
        if deposit.status != RecurringDepositStatus.PAUSED:
            raise ConflictError("Can only resume a PAUSED recurring deposit")

        from datetime import datetime, time
        now = datetime.now(UTC)
        exec_time = deposit.execution_time_local or "09:00"
        hour, minute = int(exec_time.split(":")[0]), int(exec_time.split(":")[1])
        next_exec = _compute_next_execution(deposit.frequency, now)

        deposit.status = RecurringDepositStatus.ACTIVE
        deposit.next_execution_at = next_exec
        deposit.version += 1
        db.session.commit()
        return deposit

    def cancel_recurring_deposit(self, account_id, deposit_id, user):
        account = self.get_account(account_id, user)
        deposit = self.recurring_repo.get_by_id(deposit_id)
        if not deposit or deposit.account_id != account.id:
            raise NotFoundError("Recurring deposit not found")
        if deposit.status in (RecurringDepositStatus.CANCELLED, RecurringDepositStatus.COMPLETED):
            raise ConflictError("Recurring deposit is already in a terminal state")
        deposit.status = RecurringDepositStatus.CANCELLED
        deposit.next_execution_at = None
        deposit.version += 1
        db.session.commit()
        return deposit

    def list_recurring_deposits(self, account_id, user, page=1, per_page=20):
        account = self.get_account(account_id, user)
        return self.recurring_repo.get_by_account_paginated(account.id, page=page, per_page=per_page)

    def process_due_recurring_deposits(self):
        """Called by Celery beat task to process all due recurring deposits."""
        now = datetime.now(UTC)
        due_deposits = self.recurring_repo.get_due_deposits(now)

        for deposit in due_deposits:
            try:
                account = self.account_repo.lock_for_update(deposit.account_id)
                if not account or account.status != BankAccountStatus.ACTIVE:
                    deposit.status = RecurringDepositStatus.FAILED
                    deposit.last_failure_code = "ACCOUNT_NOT_ACTIVE"
                    db.session.commit()
                    continue

                amount = deposit.amount
                balance_before = account.current_balance
                balance_after = balance_before + amount

                # Create idempotency key for dedup
                key = f"recurring_{deposit.id}_{deposit.next_execution_at.date().isoformat()}"
                key_hash = _hash_idempotency_key(key)
                existing = self.txn_repo.get_by_idempotency_key(key_hash)
                if existing:
                    deposit.next_execution_at = _compute_next_execution(deposit.frequency, now)
                    if deposit.end_date and deposit.next_execution_at.date() > deposit.end_date:
                        deposit.status = RecurringDepositStatus.COMPLETED
                        deposit.next_execution_at = None
                    db.session.commit()
                    continue

                txn = BankTransaction(
                    account_id=account.id,
                    direction=BankTransactionDirection.CREDIT,
                    entry_type=BankTransactionEntryType.RECURRING_DEPOSIT,
                    amount=amount,
                    balance_before=balance_before,
                    balance_after=balance_after,
                    reason_code="RECURRING_DEPOSIT",
                    initiated_by_user_id=deposit.owner_user_id,
                    idempotency_key_hash=key_hash,
                    description=deposit.source_description,
                )
                db.session.add(txn)

                account.current_balance = balance_after
                account.version += 1

                outbox = OutboxEvent(
                    aggregate_type="BankAccount",
                    aggregate_id=account.id,
                    event_type="bank_account.recurring_deposit_posted",
                    payload={
                        "account_id": account.id,
                        "transaction_id": txn.id,
                        "recurring_deposit_id": deposit.id,
                        "amount": str(amount),
                        "balance_after": str(balance_after),
                    },
                )
                db.session.add(outbox)

                deposit.next_execution_at = _compute_next_execution(deposit.frequency, now)
                if deposit.end_date and deposit.next_execution_at.date() > deposit.end_date:
                    deposit.status = RecurringDepositStatus.COMPLETED
                    deposit.next_execution_at = None

                db.session.commit()
                logger.info("Processed recurring deposit %s, txn %s", deposit.id, txn.id)

            except Exception:
                db.session.rollback()
                logger.exception("Failed to process recurring deposit %s", deposit.id)

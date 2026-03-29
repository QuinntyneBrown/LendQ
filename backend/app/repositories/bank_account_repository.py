from app.extensions import db
from app.models.bank_account import BankAccount
from app.models.bank_transaction import BankTransaction
from app.models.recurring_deposit import RecurringDeposit
from app.repositories.base import BaseRepository


class BankAccountRepository(BaseRepository):
    model = BankAccount

    def get_by_user_id(self, user_id):
        return BankAccount.query.filter_by(user_id=user_id).first()

    def get_all_by_user_id(self, user_id):
        return BankAccount.query.filter_by(user_id=user_id).all()

    def lock_for_update(self, account_id):
        return db.session.query(BankAccount).filter_by(id=account_id).with_for_update().first()


class BankTransactionRepository(BaseRepository):
    model = BankTransaction

    def get_by_account_paginated(self, account_id, page=1, per_page=20, entry_type=None, order_by=None):
        filters = [BankTransaction.account_id == account_id]
        if entry_type:
            filters.append(BankTransaction.entry_type == entry_type)
        return self.get_paginated(
            page=page,
            per_page=per_page,
            filters=filters,
            order_by=order_by or BankTransaction.created_at.desc(),
        )

    def get_by_idempotency_key(self, key_hash):
        return BankTransaction.query.filter_by(idempotency_key_hash=key_hash).first()


class RecurringDepositRepository(BaseRepository):
    model = RecurringDeposit

    def get_by_account(self, account_id):
        return RecurringDeposit.query.filter_by(account_id=account_id).all()

    def get_due_deposits(self, now):
        from datetime import datetime
        return (
            db.session.query(RecurringDeposit)
            .filter(
                RecurringDeposit.status == "ACTIVE",
                RecurringDeposit.next_execution_at <= now,
            )
            .with_for_update(skip_locked=True)
            .all()
        )

    def get_by_account_paginated(self, account_id, page=1, per_page=20):
        return self.get_paginated(
            page=page,
            per_page=per_page,
            filters=[RecurringDeposit.account_id == account_id],
            order_by=RecurringDeposit.created_at.desc(),
        )

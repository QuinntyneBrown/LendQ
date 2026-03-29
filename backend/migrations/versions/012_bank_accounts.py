"""Bank accounts, transactions, and recurring deposits."""

import sqlalchemy as sa
from alembic import op

revision = "012"
down_revision = "011"


def upgrade():
    op.create_table(
        "bank_accounts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("currency", sa.String(3), nullable=False, server_default="USD"),
        sa.Column("current_balance", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("status", sa.String(20), nullable=False, server_default="ACTIVE"),
        sa.Column("timezone", sa.String(50), nullable=False, server_default="UTC"),
        sa.Column("version", sa.Integer, nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    op.create_table(
        "bank_transactions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("account_id", sa.String(36), sa.ForeignKey("bank_accounts.id"), nullable=False, index=True),
        sa.Column("direction", sa.String(10), nullable=False),
        sa.Column("entry_type", sa.String(30), nullable=False),
        sa.Column("amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("balance_before", sa.Numeric(14, 2), nullable=False),
        sa.Column("balance_after", sa.Numeric(14, 2), nullable=False),
        sa.Column("reason_code", sa.String(50), nullable=True),
        sa.Column("initiated_by_user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("idempotency_key_hash", sa.String(255), nullable=True, index=True),
        sa.Column("reversed_transaction_id", sa.String(36), sa.ForeignKey("bank_transactions.id"), nullable=True),
        sa.Column("correlation_id", sa.String(36), nullable=True),
        sa.Column("description", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "recurring_deposits",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("account_id", sa.String(36), sa.ForeignKey("bank_accounts.id"), nullable=False, index=True),
        sa.Column("owner_user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("source_description", sa.String(255), nullable=False),
        sa.Column("frequency", sa.String(20), nullable=False),
        sa.Column("start_date", sa.Date, nullable=False),
        sa.Column("end_date", sa.Date, nullable=True),
        sa.Column("execution_time_local", sa.String(5), nullable=False, server_default="09:00"),
        sa.Column("timezone", sa.String(50), nullable=False, server_default="UTC"),
        sa.Column("status", sa.String(20), nullable=False, server_default="ACTIVE"),
        sa.Column("next_execution_at", sa.DateTime, nullable=True),
        sa.Column("last_failure_code", sa.String(100), nullable=True),
        sa.Column("version", sa.Integer, nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )


def downgrade():
    op.drop_table("recurring_deposits")
    op.drop_table("bank_transactions")
    op.drop_table("bank_accounts")

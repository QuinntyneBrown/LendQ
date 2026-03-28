"""Financial integrity: immutable ledger tables

Revision ID: 009
Revises: 008
"""
from alembic import op
import sqlalchemy as sa

revision = "009"
down_revision = "008"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "schedule_versions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("loan_id", sa.String(36), sa.ForeignKey("loans.id"), nullable=False, index=True),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("effective_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("created_by_event_id", sa.String(36), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "schedule_installments",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("schedule_version_id", sa.String(36), sa.ForeignKey("schedule_versions.id"), nullable=False, index=True),
        sa.Column("sequence", sa.Integer(), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=False),
        sa.Column("amount_due", sa.Numeric(12, 2), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="SCHEDULED"),
        sa.Column("original_due_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "payment_transactions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("loan_id", sa.String(36), sa.ForeignKey("loans.id"), nullable=False, index=True),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("direction", sa.String(10), nullable=False),
        sa.Column("transaction_type", sa.String(20), nullable=False),
        sa.Column("posted_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("payment_method", sa.String(50), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("idempotency_key", sa.String(255), nullable=True, unique=True, index=True),
        sa.Column("created_by", sa.String(36), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "payment_allocations",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("transaction_id", sa.String(36), sa.ForeignKey("payment_transactions.id"), nullable=False, index=True),
        sa.Column("installment_id", sa.String(36), sa.ForeignKey("schedule_installments.id"), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "schedule_adjustment_events",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("loan_id", sa.String(36), sa.ForeignKey("loans.id"), nullable=False, index=True),
        sa.Column("type", sa.String(30), nullable=False),
        sa.Column("actor_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("from_version_id", sa.String(36), sa.ForeignKey("schedule_versions.id"), nullable=True),
        sa.Column("to_version_id", sa.String(36), sa.ForeignKey("schedule_versions.id"), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="APPLIED"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("resolved_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "idempotency_records",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("idempotency_key", sa.String(255), nullable=False, unique=True, index=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("loan_id", sa.String(36), sa.ForeignKey("loans.id"), nullable=True),
        sa.Column("request_hash", sa.String(255), nullable=True),
        sa.Column("response_body", sa.JSON(), nullable=True),
        sa.Column("response_status", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
    )


def downgrade():
    op.drop_table("idempotency_records")
    op.drop_table("schedule_adjustment_events")
    op.drop_table("payment_allocations")
    op.drop_table("payment_transactions")
    op.drop_table("schedule_installments")
    op.drop_table("schedule_versions")

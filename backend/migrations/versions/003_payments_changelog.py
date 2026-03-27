"""Payments and change log tables

Revision ID: 003
Revises: 002
Create Date: 2024-01-01
"""
from alembic import op
import sqlalchemy as sa

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "payments",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("loan_id", sa.String(36), sa.ForeignKey("loans.id"), nullable=False),
        sa.Column("amount_due", sa.Numeric(12, 2), nullable=False),
        sa.Column("amount_paid", sa.Numeric(12, 2), server_default="0.00"),
        sa.Column("due_date", sa.Date, nullable=False),
        sa.Column("paid_date", sa.Date),
        sa.Column("original_due_date", sa.Date),
        sa.Column("status", sa.String(20), nullable=False, server_default="SCHEDULED"),
        sa.Column("notes", sa.Text),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_payments_loan_id", "payments", ["loan_id"])
    op.create_index("ix_payments_due_date", "payments", ["due_date"])
    op.create_index("ix_payments_status", "payments", ["status"])

    op.create_table(
        "change_logs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", sa.String(36), nullable=False),
        sa.Column("field_name", sa.String(100), nullable=False),
        sa.Column("old_value", sa.Text),
        sa.Column("new_value", sa.Text),
        sa.Column("changed_by", sa.String(36), sa.ForeignKey("users.id")),
        sa.Column("changed_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column("reason", sa.Text),
    )
    op.create_index("ix_change_logs_entity_type", "change_logs", ["entity_type"])
    op.create_index("ix_change_logs_entity_id", "change_logs", ["entity_id"])


def downgrade():
    op.drop_index("ix_change_logs_entity_id", table_name="change_logs")
    op.drop_index("ix_change_logs_entity_type", table_name="change_logs")
    op.drop_table("change_logs")
    op.drop_index("ix_payments_status", table_name="payments")
    op.drop_index("ix_payments_due_date", table_name="payments")
    op.drop_index("ix_payments_loan_id", table_name="payments")
    op.drop_table("payments")

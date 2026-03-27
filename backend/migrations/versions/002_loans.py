"""Loans table

Revision ID: 002
Revises: 001
Create Date: 2024-01-01
"""
from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "loans",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("creditor_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("borrower_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("description", sa.String(500), nullable=False),
        sa.Column("principal", sa.Numeric(12, 2), nullable=False),
        sa.Column("interest_rate", sa.Numeric(5, 2), server_default="0.00"),
        sa.Column("repayment_frequency", sa.String(20), nullable=False),
        sa.Column("start_date", sa.Date, nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="ACTIVE"),
        sa.Column("notes", sa.Text),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_loans_creditor_id", "loans", ["creditor_id"])
    op.create_index("ix_loans_borrower_id", "loans", ["borrower_id"])
    op.create_index("ix_loans_status", "loans", ["status"])


def downgrade():
    op.drop_index("ix_loans_status", table_name="loans")
    op.drop_index("ix_loans_borrower_id", table_name="loans")
    op.drop_index("ix_loans_creditor_id", table_name="loans")
    op.drop_table("loans")

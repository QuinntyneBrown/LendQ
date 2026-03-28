"""Loan governance: terms versions and change requests

Revision ID: 010
Revises: 009
"""
from alembic import op
import sqlalchemy as sa

revision = "010"
down_revision = "009"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "loan_terms_versions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("loan_id", sa.String(36), sa.ForeignKey("loans.id"), nullable=False, index=True),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("principal_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False, server_default="USD"),
        sa.Column("interest_rate_percent", sa.Numeric(5, 2), nullable=False, server_default="0"),
        sa.Column("repayment_frequency", sa.String(20), nullable=False),
        sa.Column("installment_count", sa.Integer(), nullable=True),
        sa.Column("maturity_date", sa.Date(), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("creditor_notes", sa.Text(), nullable=True),
        sa.Column("effective_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("created_by", sa.String(36), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "loan_change_requests",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("loan_id", sa.String(36), sa.ForeignKey("loans.id"), nullable=False, index=True),
        sa.Column("requested_by", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("type", sa.String(30), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="PENDING"),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("proposed_changes", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("resolved_at", sa.DateTime(), nullable=True),
        sa.Column("resolved_by", sa.String(36), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("outcome_terms_version_id", sa.String(36), sa.ForeignKey("loan_terms_versions.id"), nullable=True),
    )

    op.add_column("loans", sa.Column("current_terms_version_id", sa.String(36), sa.ForeignKey("loan_terms_versions.id"), nullable=True))
    op.add_column("loans", sa.Column("current_schedule_version_id", sa.String(36), sa.ForeignKey("schedule_versions.id"), nullable=True))


def downgrade():
    op.drop_column("loans", "current_schedule_version_id")
    op.drop_column("loans", "current_terms_version_id")
    op.drop_table("loan_change_requests")
    op.drop_table("loan_terms_versions")

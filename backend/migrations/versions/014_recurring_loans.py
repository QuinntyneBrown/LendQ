"""Recurring loans: templates, consents, and generated records

Revision ID: 014
Revises: 013
"""
from alembic import op
import sqlalchemy as sa

revision = "014"
down_revision = "013"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "recurring_loans",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("creditor_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("borrower_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("recurrence_interval", sa.String(20), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("max_occurrences", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="DRAFT", index=True),
        sa.Column("active_template_version_id", sa.String(36), nullable=True),
        sa.Column("total_generated", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("next_generation_at", sa.DateTime(), nullable=True),
        sa.Column("last_failure_code", sa.String(100), nullable=True),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "recurring_loan_template_versions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("recurring_loan_id", sa.String(36), sa.ForeignKey("recurring_loans.id"), nullable=False, index=True),
        sa.Column("version_number", sa.Integer(), nullable=False),
        sa.Column("description_template", sa.String(500), nullable=False),
        sa.Column("principal_amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False, server_default="USD"),
        sa.Column("interest_rate_percent", sa.Numeric(5, 2), nullable=True),
        sa.Column("repayment_frequency", sa.String(20), nullable=False),
        sa.Column("installment_count", sa.Integer(), nullable=False),
        sa.Column("timezone", sa.String(50), nullable=False, server_default="UTC"),
        sa.Column("allow_parallel_active_generated_loans", sa.Boolean(), nullable=False, server_default="0"),
        sa.Column("max_generated_loan_principal_exposure", sa.Numeric(14, 2), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    # Add FK from recurring_loans to template versions now that the table exists
    op.create_foreign_key(
        "fk_recurring_loans_active_template",
        "recurring_loans",
        "recurring_loan_template_versions",
        ["active_template_version_id"],
        ["id"],
    )

    op.create_table(
        "recurring_loan_consents",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("recurring_loan_id", sa.String(36), sa.ForeignKey("recurring_loans.id"), nullable=False, index=True),
        sa.Column("template_version_id", sa.String(36), sa.ForeignKey("recurring_loan_template_versions.id"), nullable=False),
        sa.Column("decision", sa.String(20), nullable=False),
        sa.Column("decided_by_user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("decided_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "generated_loan_records",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("recurring_loan_id", sa.String(36), sa.ForeignKey("recurring_loans.id"), nullable=False, index=True),
        sa.Column("loan_id", sa.String(36), sa.ForeignKey("loans.id"), nullable=False, index=True),
        sa.Column("template_version_id", sa.String(36), sa.ForeignKey("recurring_loan_template_versions.id"), nullable=False),
        sa.Column("scheduled_for_date", sa.Date(), nullable=False),
        sa.Column("sequence", sa.Integer(), nullable=False),
        sa.Column("generated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table("generated_loan_records")
    op.drop_table("recurring_loan_consents")
    op.drop_constraint("fk_recurring_loans_active_template", "recurring_loans", type_="foreignkey")
    op.drop_table("recurring_loan_template_versions")
    op.drop_table("recurring_loans")

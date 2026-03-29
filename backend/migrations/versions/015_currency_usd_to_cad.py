"""Change default currency from USD to CAD and migrate existing data."""

import sqlalchemy as sa
from alembic import op

revision = "015"
down_revision = "014"


def upgrade():
    # Update server defaults on currency columns
    op.alter_column(
        "bank_accounts",
        "currency",
        server_default="CAD",
        existing_type=sa.String(3),
        existing_nullable=False,
    )
    op.alter_column(
        "savings_goals",
        "currency",
        server_default="CAD",
        existing_type=sa.String(3),
        existing_nullable=False,
    )
    op.alter_column(
        "loan_terms_versions",
        "currency",
        server_default="CAD",
        existing_type=sa.String(3),
        existing_nullable=False,
    )
    op.alter_column(
        "recurring_loan_template_versions",
        "currency",
        server_default="CAD",
        existing_type=sa.String(3),
        existing_nullable=False,
    )

    # Migrate existing data from USD to CAD
    op.execute("UPDATE bank_accounts SET currency='CAD' WHERE currency='USD'")
    op.execute("UPDATE savings_goals SET currency='CAD' WHERE currency='USD'")
    op.execute("UPDATE loan_terms_versions SET currency='CAD' WHERE currency='USD'")
    op.execute("UPDATE recurring_loan_template_versions SET currency='CAD' WHERE currency='USD'")


def downgrade():
    # Revert existing data from CAD back to USD
    op.execute("UPDATE bank_accounts SET currency='USD' WHERE currency='CAD'")
    op.execute("UPDATE savings_goals SET currency='USD' WHERE currency='CAD'")
    op.execute("UPDATE loan_terms_versions SET currency='USD' WHERE currency='CAD'")
    op.execute("UPDATE recurring_loan_template_versions SET currency='USD' WHERE currency='CAD'")

    # Revert server defaults back to USD
    op.alter_column(
        "bank_accounts",
        "currency",
        server_default="USD",
        existing_type=sa.String(3),
        existing_nullable=False,
    )
    op.alter_column(
        "savings_goals",
        "currency",
        server_default="USD",
        existing_type=sa.String(3),
        existing_nullable=False,
    )
    op.alter_column(
        "loan_terms_versions",
        "currency",
        server_default="USD",
        existing_type=sa.String(3),
        existing_nullable=False,
    )
    op.alter_column(
        "recurring_loan_template_versions",
        "currency",
        server_default="USD",
        existing_type=sa.String(3),
        existing_nullable=False,
    )

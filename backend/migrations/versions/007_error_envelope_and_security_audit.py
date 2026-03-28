"""Add security_audit_events table

Revision ID: 007
Revises: 006
"""
from alembic import op
import sqlalchemy as sa

revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "security_audit_events",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=True, index=True),
        sa.Column("action", sa.String(50), nullable=False),
        sa.Column("outcome", sa.String(20), nullable=False),
        sa.Column("request_id", sa.String(36)),
        sa.Column("ip_address", sa.String(45)),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column("before_values", sa.JSON),
        sa.Column("after_values", sa.JSON),
    )


def downgrade():
    op.drop_table("security_audit_events")

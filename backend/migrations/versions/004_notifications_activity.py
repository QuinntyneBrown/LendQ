"""Notifications and activity items tables

Revision ID: 004
Revises: 003
Create Date: 2024-01-01
"""
from alembic import op
import sqlalchemy as sa

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "notifications",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("type", sa.String(30), nullable=False),
        sa.Column("message", sa.String(500), nullable=False),
        sa.Column("loan_id", sa.String(36), sa.ForeignKey("loans.id")),
        sa.Column("is_read", sa.Boolean, server_default=sa.text("false"), nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])
    op.create_index("ix_notifications_type", "notifications", ["type"])
    op.create_index("ix_notifications_loan_id", "notifications", ["loan_id"])

    op.create_table(
        "activity_items",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("event_type", sa.String(50), nullable=False),
        sa.Column("description", sa.String(500), nullable=False),
        sa.Column("loan_id", sa.String(36), sa.ForeignKey("loans.id")),
        sa.Column("timestamp", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_activity_items_user_id", "activity_items", ["user_id"])
    op.create_index("ix_activity_items_loan_id", "activity_items", ["loan_id"])

    op.create_table(
        "notification_preferences",
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("notification_type", sa.String(30), primary_key=True),
        sa.Column("email_enabled", sa.Boolean, server_default=sa.text("true"), nullable=False),
    )


def downgrade():
    op.drop_table("notification_preferences")
    op.drop_index("ix_activity_items_loan_id", table_name="activity_items")
    op.drop_index("ix_activity_items_user_id", table_name="activity_items")
    op.drop_table("activity_items")
    op.drop_index("ix_notifications_loan_id", table_name="notifications")
    op.drop_index("ix_notifications_type", table_name="notifications")
    op.drop_index("ix_notifications_user_id", table_name="notifications")
    op.drop_table("notifications")

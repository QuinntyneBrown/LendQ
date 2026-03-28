"""Notifications overhaul: delivery tracking, outbox, preferences restructure

Revision ID: 011
Revises: 010
"""
from alembic import op
import sqlalchemy as sa

revision = "011"
down_revision = "010"
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to notifications
    op.add_column("notifications", sa.Column("title", sa.String(200), nullable=True))
    op.add_column("notifications", sa.Column("body", sa.Text(), nullable=True))
    op.add_column("notifications", sa.Column("related_loan_id", sa.String(36), sa.ForeignKey("loans.id"), nullable=True))

    # Create notification_deliveries
    op.create_table(
        "notification_deliveries",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("notification_id", sa.String(36), sa.ForeignKey("notifications.id"), nullable=False, index=True),
        sa.Column("channel", sa.String(20), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="PENDING"),
        sa.Column("attempt_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_attempt_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    # Create outbox_events
    op.create_table(
        "outbox_events",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("aggregate_type", sa.String(50), nullable=False),
        sa.Column("aggregate_id", sa.String(36), nullable=False),
        sa.Column("event_type", sa.String(50), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("published_at", sa.DateTime(), nullable=True),
    )

    # Restructure notification_preferences from composite PK to single-row
    op.rename_table("notification_preferences", "notification_preferences_deprecated")
    op.create_table(
        "notification_preferences",
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("payment_due_email", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("payment_overdue_email", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("payment_received_email", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("schedule_changed_email", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("loan_modified_email", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("system_email", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )


def downgrade():
    op.drop_table("notification_preferences")
    op.rename_table("notification_preferences_deprecated", "notification_preferences")
    op.drop_table("outbox_events")
    op.drop_table("notification_deliveries")
    op.drop_column("notifications", "related_loan_id")
    op.drop_column("notifications", "body")
    op.drop_column("notifications", "title")

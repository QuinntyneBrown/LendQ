"""Auth session overhaul: auth_sessions, email_verification_tokens, password_reset_tokens, user columns

Revision ID: 008
Revises: 007
"""
from alembic import op
import sqlalchemy as sa

revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to users
    op.add_column("users", sa.Column("email_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    op.add_column("users", sa.Column("session_version", sa.Integer(), nullable=False, server_default=sa.text("1")))

    # Create auth_sessions table
    op.create_table(
        "auth_sessions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("session_hash", sa.String(255), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column("last_seen_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column("user_agent", sa.String(500)),
        sa.Column("ip_address", sa.String(45)),
        sa.Column("revoked_at", sa.DateTime),
    )

    # Create email_verification_tokens table
    op.create_table(
        "email_verification_tokens",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("token_hash", sa.String(255), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column("expires_at", sa.DateTime, nullable=False),
        sa.Column("verified_at", sa.DateTime),
    )

    # Create password_reset_tokens table
    op.create_table(
        "password_reset_tokens",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("token_hash", sa.String(255), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column("expires_at", sa.DateTime, nullable=False),
        sa.Column("used_at", sa.DateTime),
    )

    # Rename old refresh_tokens table (keep for rollback safety)
    op.rename_table("refresh_tokens", "refresh_tokens_deprecated")

    # Remove deprecated columns from users
    op.drop_column("users", "reset_token_hash")
    op.drop_column("users", "reset_token_expires")


def downgrade():
    op.add_column("users", sa.Column("reset_token_hash", sa.String(255)))
    op.add_column("users", sa.Column("reset_token_expires", sa.DateTime))
    op.rename_table("refresh_tokens_deprecated", "refresh_tokens")
    op.drop_table("password_reset_tokens")
    op.drop_table("email_verification_tokens")
    op.drop_table("auth_sessions")
    op.drop_column("users", "session_version")
    op.drop_column("users", "email_verified")

"""add payment services tables

Revision ID: 202512101200
Revises: 2a2fb7ec5a8b
Create Date: 2025-12-10
"""

from alembic import op
import sqlalchemy as sa


revision = "202512101200"
down_revision = "2a2fb7ec5a8b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create payment_service_categories table
    op.create_table(
        "payment_service_categories",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("public_id", sa.String(length=36), nullable=False, unique=True, index=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("accent", sa.String(length=64), nullable=False, server_default="#6366F1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
    )

    # Create payment_services table
    op.create_table(
        "payment_services",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("public_id", sa.String(length=36), nullable=False, unique=True, index=True),
        sa.Column("category_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("price", sa.Integer(), nullable=False),
        sa.Column("price_label", sa.String(length=255), nullable=False),
        sa.Column("billing", sa.String(length=32), nullable=False, server_default="perService"),
        sa.Column("hint", sa.String(length=255), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("duration", sa.String(length=64), nullable=True),
        sa.Column("trainer", sa.String(length=128), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(["category_id"], ["payment_service_categories.id"], ondelete="CASCADE"),
    )


def downgrade() -> None:
    op.drop_table("payment_services")
    op.drop_table("payment_service_categories")


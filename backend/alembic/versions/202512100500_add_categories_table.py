"""add categories table

Revision ID: 202512100500
Revises: 202512100400
Create Date: 2025-12-10
"""

from alembic import op
import sqlalchemy as sa


revision = "202512100500"
down_revision = "202512100400"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("public_id", sa.String(length=36), nullable=False, unique=True, index=True),
        sa.Column("name", sa.String(length=128), nullable=False, unique=True),
        sa.Column("icon", sa.String(length=64), nullable=True),
        sa.Column("accent", sa.String(length=16), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
    )


def downgrade() -> None:
    op.drop_table("categories")


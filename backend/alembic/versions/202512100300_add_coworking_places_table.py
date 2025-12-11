"""add coworking places table

Revision ID: 202512100300
Revises: 202512100200
Create Date: 2025-12-10
"""

from alembic import op
import sqlalchemy as sa


revision = "202512100300"
down_revision = "202512100200"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "coworking_places",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("public_id", sa.String(length=36), nullable=False, unique=True, index=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("type", sa.String(length=32), nullable=False),
        sa.Column("seats", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("price_1h", sa.Integer(), nullable=True),
        sa.Column("price_3h", sa.Integer(), nullable=True),
        sa.Column("price_day", sa.Integer(), nullable=True),
        sa.Column("price_month", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
    )


def downgrade() -> None:
    op.drop_table("coworking_places")


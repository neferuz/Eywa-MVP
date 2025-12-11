"""add dashboard tables

Revision ID: 202511241330
Revises: 202511241200
Create Date: 2025-11-24 13:30:00
"""

from alembic import op
import sqlalchemy as sa


revision = "202511241330"
down_revision = "202511241200"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "dashboard_kpi",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("label", sa.String(length=128), nullable=False),
        sa.Column("value", sa.String(length=64), nullable=False),
        sa.Column("unit", sa.String(length=16)),
        sa.Column("change", sa.String(length=16), nullable=False),
        sa.Column("trend", sa.Enum("up", "down", name="dashboard_trend_enum"), nullable=False),
        sa.Column("icon", sa.String(length=64), nullable=False),
        sa.Column("color", sa.String(length=16), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    op.create_table(
        "dashboard_load",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("label", sa.String(length=64), nullable=False),
        sa.Column("value", sa.Integer(), nullable=False),
        sa.Column("detail", sa.String(length=255), nullable=False),
        sa.Column("color", sa.String(length=16), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    op.create_table(
        "dashboard_highlights",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("detail", sa.String(length=512), nullable=False),
        sa.Column("tone", sa.String(length=16), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("dashboard_highlights")
    op.drop_table("dashboard_load")
    op.drop_table("dashboard_kpi")
    sa.Enum(name="dashboard_trend_enum").drop(op.get_bind(), checkfirst=True)


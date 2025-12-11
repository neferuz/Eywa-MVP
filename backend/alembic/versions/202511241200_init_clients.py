"""init clients table

Revision ID: 202511241200
Revises:
Create Date: 2025-11-24 12:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "202511241200"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "clients",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("public_id", sa.String(length=36), nullable=False, unique=True, index=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=32), nullable=False),
        sa.Column("instagram", sa.String(length=128)),
        sa.Column("source", sa.String(length=64), nullable=False),
        sa.Column("direction", sa.Enum("Body", "Coworking", "Coffee", name="direction_enum"), nullable=False),
        sa.Column("status", sa.Enum("Активный", "Новый", "Ушедший", name="status_enum"), nullable=False),
        sa.Column("contraindications", sa.String(length=512)),
        sa.Column("coach_notes", sa.String(length=1024)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("clients")
    sa.Enum(name="direction_enum").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="status_enum").drop(op.get_bind(), checkfirst=True)


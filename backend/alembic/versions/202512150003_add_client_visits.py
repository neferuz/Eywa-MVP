"""add client visits and activation_date

Revision ID: 202512150003
Revises: 202512150002
Create Date: 2025-12-15 00:03:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "202512150003"
down_revision = "202512150002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Добавляем поле visits как JSONB
    op.add_column("clients", sa.Column("visits", postgresql.JSON(astext_type=sa.Text()), nullable=True))
    
    # Добавляем поле activation_date
    op.add_column("clients", sa.Column("activation_date", sa.String(length=20), nullable=True))


def downgrade() -> None:
    op.drop_column("clients", "activation_date")
    op.drop_column("clients", "visits")


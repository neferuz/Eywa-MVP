"""merge heads

Revision ID: 202512150004
Revises: 202512150000, 202512150003
Create Date: 2025-12-15 00:04:00
"""

from alembic import op
import sqlalchemy as sa


revision = "202512150004"
down_revision = ("202512150000", "202512150003")
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Merge миграция - не требует изменений в БД
    pass


def downgrade() -> None:
    # Merge миграция - не требует изменений в БД
    pass


"""fix birth_date column length

Revision ID: 202512150002
Revises: 202512150001
Create Date: 2025-12-15
"""

from alembic import op
import sqlalchemy as sa


revision = "202512150002"
down_revision = "202512150001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Увеличиваем размер колонки birth_date с 10 до 20 символов для формата даты
    op.alter_column("clients", "birth_date", type_=sa.String(length=20), existing_nullable=True)


def downgrade() -> None:
    # Возвращаем обратно к 10 символам (может привести к потере данных)
    op.alter_column("clients", "birth_date", type_=sa.String(length=10), existing_nullable=True)


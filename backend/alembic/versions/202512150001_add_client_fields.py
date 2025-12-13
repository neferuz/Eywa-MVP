"""add client fields contract_number subscription_number birth_date

Revision ID: 202512150001
Revises: 202512101300
Create Date: 2025-12-15
"""

from alembic import op
import sqlalchemy as sa


revision = "202512150001"
down_revision = "202512101300"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Добавляем новые колонки в таблицу clients
    op.add_column("clients", sa.Column("contract_number", sa.String(length=64), nullable=True))
    op.add_column("clients", sa.Column("subscription_number", sa.String(length=64), nullable=True))
    op.add_column("clients", sa.Column("birth_date", sa.String(length=10), nullable=True))


def downgrade() -> None:
    # Удаляем добавленные колонки
    op.drop_column("clients", "birth_date")
    op.drop_column("clients", "subscription_number")
    op.drop_column("clients", "contract_number")


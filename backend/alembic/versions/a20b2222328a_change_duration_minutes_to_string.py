"""change_duration_minutes_to_string

Revision ID: a20b2222328a
Revises: 202512100500
Create Date: 2025-12-11 01:21:54.514187
"""
from alembic import op
import sqlalchemy as sa


revision = 'a20b2222328a'
down_revision = '202512100500'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Изменяем тип колонки duration_minutes с Integer на String
    # Сначала конвертируем существующие int значения в строки
    op.execute("""
        ALTER TABLE services 
        ALTER COLUMN duration_minutes TYPE VARCHAR(64) 
        USING duration_minutes::text;
    """)


def downgrade() -> None:
    # Возвращаем обратно к Integer (только если все значения можно преобразовать в числа)
    op.execute("""
        ALTER TABLE services 
        ALTER COLUMN duration_minutes TYPE INTEGER 
        USING CASE 
            WHEN duration_minutes ~ '^[0-9]+$' THEN duration_minutes::integer 
            ELSE 0 
        END;
    """)


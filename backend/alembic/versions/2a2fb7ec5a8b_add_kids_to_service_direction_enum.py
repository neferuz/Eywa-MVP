"""add_kids_to_service_direction_enum

Revision ID: 2a2fb7ec5a8b
Revises: a20b2222328a
Create Date: 2025-12-11 02:04:41.032610
"""
from alembic import op
import sqlalchemy as sa


revision = '2a2fb7ec5a8b'
down_revision = 'a20b2222328a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Добавляем 'Kids' в существующий enum
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_enum 
                WHERE enumlabel = 'Kids' 
                AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'service_direction_enum')
            ) THEN
                ALTER TYPE service_direction_enum ADD VALUE 'Kids';
            END IF;
        END $$;
    """)


def downgrade() -> None:
    # Удаление значения из enum в PostgreSQL сложно, поэтому просто оставляем комментарий
    # В реальном проекте может потребоваться пересоздание enum или миграция данных
    pass


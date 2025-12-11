"""add_users_table

Revision ID: 202412020000
Revises: fafae8bfff87
Create Date: 2024-12-02 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# Хеши паролей для супер-админов (сгенерированы заранее)
# notferuz@gmail.com / 1235804679f
# anastasiya.polovinkina@gmail.com / madina222
# Эти хеши были сгенерированы с помощью: CryptContext(schemes=["bcrypt"]).hash(password)

revision = '202412020000'
down_revision = 'fafae8bfff87'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Создаем таблицу users
    op.create_table('users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('is_super_admin', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    
    # Добавляем двух супер-админов
    from sqlalchemy import table, column, String, Boolean
    users_table = table('users',
        column('email', String),
        column('password_hash', String),
        column('is_super_admin', Boolean),
        column('is_active', Boolean),
    )
    
    # Генерируем хеши паролей
    # Используем простой способ без passlib в миграции
    import bcrypt
    hash1 = bcrypt.hashpw('1235804679f'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    hash2 = bcrypt.hashpw('madina222'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    op.bulk_insert(users_table, [
        {
            'email': 'notferuz@gmail.com',
            'password_hash': hash1,
            'is_super_admin': True,
            'is_active': True,
        },
        {
            'email': 'anastasiya.polovinkina@gmail.com',
            'password_hash': hash2,
            'is_super_admin': True,
            'is_active': True,
        },
    ])


def downgrade() -> None:
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')


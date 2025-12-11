"""add payments table

Revision ID: 202512101300
Revises: 202512101200
Create Date: 2025-12-10 13:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '202512101300'
down_revision = '202512101200'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create payments table
    op.create_table(
        'payments',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('public_id', sa.String(length=36), nullable=False),
        sa.Column('client_id', sa.String(length=36), nullable=True),
        sa.Column('client_name', sa.String(length=255), nullable=True),
        sa.Column('client_phone', sa.String(length=64), nullable=True),
        sa.Column('service_id', sa.String(length=36), nullable=True),
        sa.Column('service_name', sa.String(length=255), nullable=False),
        sa.Column('service_category', sa.String(length=128), nullable=True),
        sa.Column('total_amount', sa.Integer(), nullable=False),
        sa.Column('cash_amount', sa.Integer(), server_default='0', nullable=False),
        sa.Column('transfer_amount', sa.Integer(), server_default='0', nullable=False),
        sa.Column('quantity', sa.Integer(), server_default='1', nullable=False),
        sa.Column('hours', sa.Integer(), nullable=True),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=32), server_default='completed', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_payments_public_id'), 'payments', ['public_id'], unique=True)
    op.create_index(op.f('ix_payments_client_id'), 'payments', ['client_id'], unique=False)
    op.create_index(op.f('ix_payments_service_id'), 'payments', ['service_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_payments_service_id'), table_name='payments')
    op.drop_index(op.f('ix_payments_client_id'), table_name='payments')
    op.drop_index(op.f('ix_payments_public_id'), table_name='payments')
    op.drop_table('payments')


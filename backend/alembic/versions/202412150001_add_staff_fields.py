"""add staff fields to users

Revision ID: 202412150001
Revises: 202412020000
Create Date: 2024-12-15
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "202412150001"
down_revision = "202412020000"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("name", sa.String(length=255), nullable=True))
    op.add_column(
        "users",
        sa.Column(
            "role",
            sa.String(length=50),
            server_default="manager",
            nullable=False,
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "access",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="[]",
            nullable=False,
        ),
    )

    # Проставляем значения для уже существующих пользователей
    op.execute(
        """
        UPDATE users
        SET role = CASE WHEN is_super_admin THEN 'super_admin' ELSE 'admin' END,
            access = '["dashboard","schedule","applications","payments","staff","analytics"]'::jsonb,
            name = COALESCE(name, split_part(email, '@', 1))
        """
    )


def downgrade() -> None:
    op.drop_column("users", "access")
    op.drop_column("users", "role")
    op.drop_column("users", "name")


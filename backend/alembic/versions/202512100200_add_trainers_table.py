"""add trainers table

Revision ID: 202512100200
Revises: 202512100001
Create Date: 2025-12-10
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "202512100200"
down_revision = "202512100001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "trainers",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("public_id", sa.String(length=36), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=64), nullable=False),
        sa.Column(
            "directions",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="[]",
            nullable=False,
        ),
        sa.Column("schedule", sa.String(length=255), nullable=True),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_trainers_public_id"), "trainers", ["public_id"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_trainers_public_id"), table_name="trainers")
    op.drop_table("trainers")



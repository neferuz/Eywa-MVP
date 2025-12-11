"""add direction to services table

Revision ID: 202512100400
Revises: 202512100300
Create Date: 2025-12-10
"""

from alembic import op
import sqlalchemy as sa


revision = "202512100400"
down_revision = "202512100300"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Создаем enum тип для direction (если еще не существует)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE service_direction_enum AS ENUM ('Body', 'Coworking', 'Coffee');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # Добавляем колонку direction с дефолтным значением 'Body' (если еще не существует)
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    columns = [col['name'] for col in inspector.get_columns('services')]
    
    if 'direction' not in columns:
        op.add_column(
            "services",
            sa.Column(
                "direction",
                sa.Enum("Body", "Coworking", "Coffee", name="service_direction_enum"),
                server_default="Body",
                nullable=False,
            ),
        )


def downgrade() -> None:
    op.drop_column("services", "direction")
    op.execute("DROP TYPE service_direction_enum")


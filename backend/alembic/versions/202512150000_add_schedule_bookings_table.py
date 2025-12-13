"""add schedule_bookings table

Revision ID: 202512150000
Revises: 202412020000
Create Date: 2025-12-15
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "202512150000"
down_revision = "0fa9d36835dd"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Создаем таблицу schedule_bookings
    op.create_table(
        "schedule_bookings",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("public_id", sa.String(length=36), nullable=False, unique=True, index=True),
        
        # Дата и время
        sa.Column("booking_date", sa.Date(), nullable=False, index=True),
        sa.Column("booking_time", sa.Time(), nullable=False),
        
        # Категория/Тип занятия
        sa.Column("category", sa.String(length=128), nullable=False),
        
        # Для Body Mind - название занятия
        sa.Column("service_name", sa.String(length=255), nullable=True),
        
        # Тренер
        sa.Column("trainer_id", sa.String(length=36), nullable=True, index=True),
        sa.Column("trainer_name", sa.String(length=255), nullable=True),
        
        # Клиенты (JSON массив)
        sa.Column("clients", postgresql.JSONB, nullable=False, server_default="[]"),
        
        # Количество мест/человек
        sa.Column("max_capacity", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("current_count", sa.Integer(), nullable=False, server_default="0"),
        
        # Статус записи
        sa.Column("status", sa.Enum("Бронь", "Оплачено", "Свободно", name="booking_status_enum"), nullable=False, server_default="Свободно"),
        
        # Дополнительная информация
        sa.Column("notes", sa.Text(), nullable=True),
        
        # Капсула/Место
        sa.Column("capsule_id", sa.String(length=36), nullable=True),
        sa.Column("capsule_name", sa.String(length=128), nullable=True),
        
        # Timestamps
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    
    op.create_index(op.f("ix_schedule_bookings_public_id"), "schedule_bookings", ["public_id"], unique=True)
    op.create_index(op.f("ix_schedule_bookings_booking_date"), "schedule_bookings", ["booking_date"], unique=False)
    op.create_index(op.f("ix_schedule_bookings_trainer_id"), "schedule_bookings", ["trainer_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_schedule_bookings_trainer_id"), table_name="schedule_bookings")
    op.drop_index(op.f("ix_schedule_bookings_booking_date"), table_name="schedule_bookings")
    op.drop_index(op.f("ix_schedule_bookings_public_id"), table_name="schedule_bookings")
    op.drop_table("schedule_bookings")
    
    # Удаляем enum
    sa.Enum(name="booking_status_enum").drop(op.get_bind(), checkfirst=True)


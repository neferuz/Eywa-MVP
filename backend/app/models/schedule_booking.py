from __future__ import annotations

from datetime import date, time
from sqlalchemy import Date, Enum, Integer, String, Text, Time
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class ScheduleBooking(Base, TimestampMixin):
    """Модель записи/бронирования в расписании."""

    __tablename__ = "schedule_bookings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    public_id: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    
    # Дата и время
    booking_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    booking_time: Mapped[time] = mapped_column(Time, nullable=False)
    
    # Категория/Тип занятия
    category: Mapped[str] = mapped_column(String(128), nullable=False)  # "Body Mind", "Pilates Reformer", etc.
    
    # Для Body Mind - название занятия
    service_name: Mapped[str | None] = mapped_column(String(255), nullable=True)  # "Йога для начинающих"
    
    # Тренер
    trainer_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    trainer_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    # Клиенты (JSON массив с информацией о клиентах)
    # Формат: [{"client_id": "...", "client_name": "...", "client_phone": "..."}, ...]
    clients: Mapped[list[dict]] = mapped_column(JSONB, default=list, nullable=False)
    
    # Количество мест/человек
    max_capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    current_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    
    # Статус записи
    status: Mapped[str] = mapped_column(
        Enum("Бронь", "Оплачено", "Свободно", name="booking_status_enum"),
        nullable=False,
        server_default="Свободно"
    )
    
    # Дополнительная информация
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Капсула/Место (если применимо)
    capsule_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    capsule_name: Mapped[str | None] = mapped_column(String(128), nullable=True)


from __future__ import annotations

from datetime import date, time
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field, ConfigDict


class BookingStatus(str, Enum):
    BOOKED = "Бронь"
    PAID = "Оплачено"
    FREE = "Свободно"


class ClientInfo(BaseModel):
    """Информация о клиенте в записи.
    
    Используется для категорий, где может быть несколько клиентов (например, Body Mind).
    """
    client_id: str = Field(..., description="Уникальный идентификатор клиента", example="c1")
    client_name: str = Field(..., description="Имя клиента", example="Иван Петров")
    client_phone: str | None = Field(None, description="Телефон клиента", example="+7 900 123-45-67")


class ScheduleBooking(BaseModel):
    """Схема записи в расписании.
    
    Поддерживаемые категории:
    - `"Body Mind"` - групповые занятия (йога, пилатес и т.д.)
    - `"Pilates Reformer"` - занятия на пилатес-реформере
    - `"Коворкинг"` - коворкинг-места
    """
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., alias="public_id", description="Уникальный идентификатор записи")
    booking_date: str = Field(..., description="Дата записи в формате ISO (YYYY-MM-DD)", example="2025-12-15")
    booking_time: str = Field(..., description="Время записи в формате HH:MM", example="10:00")
    category: str = Field(..., description="Категория записи: 'Body Mind', 'Pilates Reformer', 'Коворкинг'", example="Body Mind")
    service_name: str | None = Field(None, description="Название услуги (для Body Mind)", example="Йога для начинающих")
    trainer_id: str | None = Field(None, description="ID тренера")
    trainer_name: str | None = Field(None, description="Имя тренера", example="Анна С.")
    clients: list[ClientInfo] = Field(default_factory=list, description="Список клиентов")
    max_capacity: int = Field(1, description="Максимальная вместимость", example=10)
    current_count: int = Field(0, description="Текущее количество записанных клиентов", example=5)
    status: BookingStatus = Field(BookingStatus.FREE, description="Статус записи")
    notes: str | None = Field(None, description="Дополнительные заметки")
    capsule_id: str | None = Field(None, description="ID капсулы (для коворкинга)")
    capsule_name: str | None = Field(None, description="Название капсулы (для коворкинга)")
    created_at: str | None = Field(None, description="Дата создания записи")
    updated_at: str | None = Field(None, description="Дата последнего обновления записи")


class ScheduleBookingCreate(BaseModel):
    """Схема для создания записи в расписании.
    
    **Категории:**
    - `"Body Mind"` - групповые занятия (йога, пилатес и т.д.). Требуется `service_name`.
    - `"Pilates Reformer"` - занятия на пилатес-реформере. Обычно `max_capacity=1`.
    - `"Коворкинг"` - коворкинг-места. Требуется `capsule_id` и `capsule_name`.
    """
    model_config = ConfigDict(populate_by_name=True)

    booking_date: str = Field(..., description="Дата записи в формате ISO (YYYY-MM-DD)", example="2025-12-15")
    booking_time: str = Field(..., description="Время записи в формате HH:MM", example="10:00")
    category: str = Field(..., description="Категория записи: 'Body Mind', 'Pilates Reformer', 'Коворкинг'", example="Body Mind")
    service_name: str | None = Field(None, description="Название услуги (обязательно для Body Mind)", example="Йога для начинающих")
    trainer_id: str | None = Field(None, description="ID тренера", example="1cefeb98-9f2e-44fd-9566-8c1363212b4b")
    trainer_name: str | None = Field(None, description="Имя тренера", example="Анна С.")
    clients: list[ClientInfo] = Field(default_factory=list, description="Список клиентов")
    max_capacity: int = Field(1, description="Максимальная вместимость", example=10)
    status: BookingStatus = Field(BookingStatus.FREE, description="Статус записи")
    notes: str | None = Field(None, description="Дополнительные заметки")
    capsule_id: str | None = Field(None, description="ID капсулы (для коворкинга)")
    capsule_name: str | None = Field(None, description="Название капсулы (для коворкинга)")


class ScheduleBookingUpdate(BaseModel):
    """Схема для обновления записи."""
    model_config = ConfigDict(populate_by_name=True)

    booking_date: str | None = None
    booking_time: str | None = None
    category: str | None = None
    service_name: str | None = None
    trainer_id: str | None = None
    trainer_name: str | None = None
    clients: list[ClientInfo] | None = None
    max_capacity: int | None = None
    status: BookingStatus | None = None
    notes: str | None = None
    capsule_id: str | None = None
    capsule_name: str | None = None


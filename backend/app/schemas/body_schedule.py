from __future__ import annotations

from pydantic import BaseModel, Field


class OverviewStats(BaseModel):
    """Общая статистика по расписанию."""
    total_slots: int = Field(..., description="Всего слотов")
    booked_slots: int = Field(..., description="Забронировано слотов")
    load_percentage: int = Field(..., description="Загрузка в процентах")


class GroupAnalytics(BaseModel):
    """Аналитика по группе (BODY или REFORM)."""
    id: str = Field(..., description="ID группы: 'body' или 'reform'")
    name: str = Field(..., description="Название группы: 'BODY' или 'REFORM'")
    label: str = Field(..., description="Метка группы: 'BODY' или 'REFORM'")
    total_classes: int = Field(..., description="Количество уникальных занятий")
    total_bookings: int = Field(..., description="Общее количество записей (клиентов)")
    load: int = Field(..., description="Загрузка в процентах")
    coaches: list[str] = Field(default_factory=list, description="Список имен тренеров")
    avg_occupancy: int = Field(..., description="Средняя заполненность в процентах")


class CoachLoad(BaseModel):
    """Загрузка тренера."""
    name: str = Field(..., description="Имя тренера")
    load: int = Field(..., description="Загрузка в процентах")
    classes: int = Field(..., description="Количество занятий за период")


class RoomLoad(BaseModel):
    """Загрузка зала."""
    room: str = Field(..., description="Название зала")
    load: int = Field(..., description="Загрузка в процентах")


class BodyScheduleAnalytics(BaseModel):
    """Полная аналитика по расписанию BODY."""
    overview: OverviewStats = Field(..., description="Общая статистика")
    groups: list[GroupAnalytics] = Field(..., description="Аналитика по группам")
    coaches: list[CoachLoad] = Field(..., description="Загрузка тренеров")
    rooms: list[RoomLoad] = Field(..., description="Загрузка залов")


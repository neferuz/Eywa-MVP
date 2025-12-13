from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field, ConfigDict


class Platform(str, Enum):
    INSTAGRAM = "instagram"
    TELEGRAM = "telegram"


class Stage(str, Enum):
    INQUIRY = "inquiry"  # Спросили цену
    TRIAL = "trial"  # Записались на пробный
    SALE = "sale"  # Оплатили абонемент


class ChatMessage(BaseModel):
    id: str
    role: Literal["user", "assistant"]
    content: str
    timestamp: str


class ApplicationCreate(BaseModel):
    """Схема для создания заявки"""
    name: str
    username: str | None = None
    phone: str | None = None
    platform: Platform
    stage: Stage
    message: str
    budget: str | None = None
    owner: str = "CRM-бот"
    chat_history: list[ChatMessage] | None = None
    telegram_chat_id: int | None = None


class ApplicationUpdate(BaseModel):
    """Схема для обновления заявки"""
    stage: Stage | None = None
    message: str | None = None
    budget: str | None = None
    owner: str | None = None
    chat_history: list[ChatMessage] | None = None


class Application(BaseModel):
    """Схема для возврата заявки"""
    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "name": "Иван",
                "username": "@ivan",
                "platform": "telegram",
                "platformName": "Telegram",
                "platformAccent": "#60A5FA",
                "stage": "inquiry",
                "stageLabel": "Спросили цену",
                "message": "Сколько стоит?",
                "budget": "до 250$",
                "owner": "CRM-бот",
                "lastActivity": "5 мин назад",
            }
        }
    )

    id: str
    name: str
    username: str | None = None
    phone: str | None = None
    platform: Platform
    platformName: str = Field(..., alias="platform_name")
    platformAccent: str = Field(..., alias="platform_accent")
    stage: Stage
    stageLabel: str = Field(..., alias="stage_label")
    message: str
    budget: str | None = None
    owner: str
    lastActivity: str = Field(..., alias="last_activity")
    chatHistory: list[ChatMessage] | None = Field(None, alias="chat_history")
    createdAt: datetime = Field(..., alias="created_at")


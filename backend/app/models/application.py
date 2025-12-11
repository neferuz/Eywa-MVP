from __future__ import annotations

from sqlalchemy import Enum, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Application(Base, TimestampMixin):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    public_id: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    
    # Информация о клиенте
    name: Mapped[str] = mapped_column(String(255))
    username: Mapped[str | None] = mapped_column(String(128), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    
    # Платформа
    platform: Mapped[str] = mapped_column(Enum("instagram", "telegram", name="platform_enum"))
    
    # Стадия заявки
    stage: Mapped[str] = mapped_column(Enum("inquiry", "trial", "sale", name="stage_enum"))
    
    # Сообщение и бюджет
    message: Mapped[str] = mapped_column(Text)
    budget: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    # Владелец заявки (кто обрабатывает)
    owner: Mapped[str] = mapped_column(String(128), default="CRM-бот")
    
    # История чата (JSON)
    chat_history: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    
    # Telegram chat_id для связи с ботом
    telegram_chat_id: Mapped[int | None] = mapped_column(nullable=True)


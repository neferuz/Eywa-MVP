from __future__ import annotations

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    public_id: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    
    # Клиент
    client_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    client_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    client_phone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    
    # Услуга
    service_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    service_name: Mapped[str] = mapped_column(String(255))
    service_category: Mapped[str | None] = mapped_column(String(128), nullable=True)
    
    # Сумма и способ оплаты
    total_amount: Mapped[int] = mapped_column(Integer)
    cash_amount: Mapped[int] = mapped_column(Integer, default=0)
    transfer_amount: Mapped[int] = mapped_column(Integer, default=0)
    
    # Дополнительная информация
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    hours: Mapped[int | None] = mapped_column(Integer, nullable=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Статус
    status: Mapped[str] = mapped_column(String(32), server_default="completed")


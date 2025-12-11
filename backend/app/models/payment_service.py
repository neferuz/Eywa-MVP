from __future__ import annotations

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class PaymentServiceCategory(Base, TimestampMixin):
    __tablename__ = "payment_service_categories"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    public_id: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    accent: Mapped[str] = mapped_column(String(64), server_default="#6366F1")


class PaymentService(Base, TimestampMixin):
    __tablename__ = "payment_services"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    public_id: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    category_id: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String(255))
    price: Mapped[int] = mapped_column(Integer)
    price_label: Mapped[str] = mapped_column(String(255))
    billing: Mapped[str] = mapped_column(String(32), server_default="perService")  # perHour, perService, custom
    hint: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration: Mapped[str | None] = mapped_column(String(64), nullable=True)
    trainer: Mapped[str | None] = mapped_column(String(128), nullable=True)


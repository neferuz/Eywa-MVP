from __future__ import annotations

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class CoworkingPlace(Base, TimestampMixin):
    __tablename__ = "coworking_places"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    public_id: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    type: Mapped[str] = mapped_column(String(32))
    seats: Mapped[int] = mapped_column(Integer, default=0)
    price_1h: Mapped[int | None] = mapped_column(Integer, nullable=True)
    price_3h: Mapped[int | None] = mapped_column(Integer, nullable=True)
    price_day: Mapped[int | None] = mapped_column(Integer, nullable=True)
    price_month: Mapped[int | None] = mapped_column(Integer, nullable=True)


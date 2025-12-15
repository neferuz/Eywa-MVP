from __future__ import annotations

from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, int_pk


class Trainer(Base, TimestampMixin):
    """Модель тренера BODY."""

    __tablename__ = "trainers"

    id: Mapped[int_pk]
    public_id: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(64), nullable=False)
    directions: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    schedule: Mapped[str | None] = mapped_column(String(255), nullable=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)











from __future__ import annotations

from sqlalchemy import Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Client(Base, TimestampMixin):
    __tablename__ = "clients"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    public_id: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str] = mapped_column(String(32))
    instagram: Mapped[str | None] = mapped_column(String(128), nullable=True)
    source: Mapped[str] = mapped_column(String(64))
    direction: Mapped[str] = mapped_column(Enum("Body", "Coworking", "Coffee", name="direction_enum"))
    status: Mapped[str] = mapped_column(Enum("Активный", "Новый", "Ушедший", name="status_enum"))
    contraindications: Mapped[str | None] = mapped_column(String(512), nullable=True)
    coach_notes: Mapped[str | None] = mapped_column(String(1024), nullable=True)


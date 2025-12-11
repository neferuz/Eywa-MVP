from __future__ import annotations

from sqlalchemy import Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class DashboardKPI(Base, TimestampMixin):
    __tablename__ = "dashboard_kpi"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    label: Mapped[str] = mapped_column(String(128))
    value: Mapped[str] = mapped_column(String(64))
    unit: Mapped[str | None] = mapped_column(String(16), nullable=True)
    change: Mapped[str] = mapped_column(String(16))
    trend: Mapped[str] = mapped_column(Enum("up", "down", name="dashboard_trend_enum"))
    icon: Mapped[str] = mapped_column(String(64))
    color: Mapped[str] = mapped_column(String(16))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class DashboardLoad(Base, TimestampMixin):
    __tablename__ = "dashboard_load"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    label: Mapped[str] = mapped_column(String(64))
    value: Mapped[int]
    detail: Mapped[str] = mapped_column(String(255))
    color: Mapped[str] = mapped_column(String(16))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class DashboardHighlight(Base, TimestampMixin):
    __tablename__ = "dashboard_highlights"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255))
    detail: Mapped[str] = mapped_column(String(512))
    tone: Mapped[str] = mapped_column(String(16))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


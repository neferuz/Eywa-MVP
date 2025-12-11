from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class Trend(str, Enum):
    UP = "up"
    DOWN = "down"


class KpiCard(BaseModel):
    label: str
    value: str
    unit: str | None = None
    change: str
    trend: Trend
    icon: str = Field(description="Name of the icon used on the frontend")
    color: str


class LoadSnapshotItem(BaseModel):
    label: str
    value: int
    detail: str
    color: str


class AiHighlight(BaseModel):
    title: str
    detail: str
    tone: str


class DashboardSummary(BaseModel):
    kpi: list[KpiCard]
    load: list[LoadSnapshotItem]
    highlights: list[AiHighlight]


from __future__ import annotations

from datetime import date

from pydantic import BaseModel


class TrafficChannel(BaseModel):
    id: str
    name: str
    accent: str
    leads: int
    inquiry: int
    trial: int
    sale: int
    conversion: float


class TrafficTrendPoint(BaseModel):
    date: date
    leads: int


class TrafficSummary(BaseModel):
    total_leads: int
    total_sales: int
    total_trials: int
    conversion: float


class MarketingTrafficResponse(BaseModel):
    summary: TrafficSummary
    channels: list[TrafficChannel]
    trend: list[TrafficTrendPoint]


class MarketingConversionRow(BaseModel):
    id: str
    channel: str
    accent: str
    leads: int
    bookings: int
    visits: int
    sales: int
    conversion: float


class MarketingConversionsResponse(BaseModel):
    rows: list[MarketingConversionRow]



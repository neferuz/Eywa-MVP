from __future__ import annotations

from enum import Enum
from pydantic import BaseModel


class BookingStatus(str, Enum):
    ARRIVED = "arrived"
    WAITING = "waiting"
    TRIAL = "trial"
    NO_SHOW = "no_show"


class BookingSource(str, Enum):
    CRM = "crm"
    AI = "ai"


class TodayBooking(BaseModel):
    id: str
    time: str
    client: str
    phone: str
    service: str
    coach: str | None = None
    room: str | None = None
    status: BookingStatus
    source: BookingSource
    note: str | None = None


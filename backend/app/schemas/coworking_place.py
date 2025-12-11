from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class CoworkingPlace(BaseModel):
    id: str = Field(..., description="Public identifier")
    name: str
    description: str | None = None
    type: Literal["capsule", "event"]
    seats: int = 0
    price_1h: int | None = None
    price_3h: int | None = None
    price_day: int | None = None
    price_month: int | None = None

    model_config = {"from_attributes": True}


class CoworkingPlaceCreate(BaseModel):
    name: str
    description: str | None = None
    type: Literal["capsule", "event"]
    seats: int = 0
    price_1h: int | None = None
    price_3h: int | None = None
    price_day: int | None = None
    price_month: int | None = None


class CoworkingPlaceUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    type: Literal["capsule", "event"] | None = None
    seats: int | None = None
    price_1h: int | None = None
    price_3h: int | None = None
    price_day: int | None = None
    price_month: int | None = None


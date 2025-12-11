from __future__ import annotations

from enum import Enum as PyEnum
from typing import Literal

from pydantic import BaseModel, Field


class ServiceDirection(str, PyEnum):
    BODY = "Body"
    COWORKING = "Coworking"
    COFFEE = "Coffee"
    KIDS = "Kids"


class Service(BaseModel):
    id: str = Field(..., description="Public identifier")
    name: str
    category: str
    direction: Literal["Body", "Coworking", "Coffee", "Kids"] = "Body"
    duration_minutes: str
    price: int
    description: str | None = None

    model_config = {"from_attributes": True}


class ServiceCreate(BaseModel):
    name: str
    category: str
    direction: Literal["Body", "Coworking", "Coffee", "Kids"] = "Body"
    duration_minutes: str
    price: int
    description: str | None = None


class ServiceUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    direction: Literal["Body", "Coworking", "Coffee"] | None = None
    duration_minutes: str | None = None
    price: int | None = None
    description: str | None = None


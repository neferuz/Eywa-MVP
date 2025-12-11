from __future__ import annotations

from pydantic import BaseModel, Field


class Category(BaseModel):
    id: str = Field(..., description="Public identifier")
    name: str
    icon: str | None = None
    accent: str | None = None

    model_config = {"from_attributes": True}


class CategoryCreate(BaseModel):
    name: str
    icon: str | None = None
    accent: str | None = None


class CategoryUpdate(BaseModel):
    name: str | None = None
    icon: str | None = None
    accent: str | None = None


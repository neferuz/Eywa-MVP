from __future__ import annotations

from pydantic import BaseModel, Field


class TrainerBase(BaseModel):
    full_name: str = Field(..., max_length=255)
    phone: str = Field(..., max_length=64)
    directions: list[str] = Field(default_factory=list)
    schedule: str | None = Field(None, max_length=255)
    comment: str | None = None


class TrainerCreate(TrainerBase):
    pass


class Trainer(TrainerBase):
    id: str = Field(..., description="Public identifier")

    model_config = {"from_attributes": True}



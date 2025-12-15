from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class PaymentBase(BaseModel):
    client_id: str | None = None
    client_name: str | None = None
    client_phone: str | None = None
    service_id: str | None = None
    service_name: str = Field(..., min_length=1, max_length=255)
    service_category: str | None = None
    total_amount: int = Field(..., ge=0)
    cash_amount: int = Field(default=0, ge=0)
    transfer_amount: int = Field(default=0, ge=0)
    quantity: int = Field(default=1, ge=1)
    hours: int | None = Field(default=None, ge=1)
    comment: str | None = None
    status: Literal["pending", "completed", "cancelled"] = "completed"


class PaymentCreate(PaymentBase):
    pass


class PaymentUpdate(BaseModel):
    client_id: str | None = None
    client_name: str | None = None
    client_phone: str | None = None
    service_id: str | None = None
    service_name: str | None = None
    service_category: str | None = None
    total_amount: int | None = Field(None, ge=0)
    cash_amount: int | None = Field(None, ge=0)
    transfer_amount: int | None = Field(None, ge=0)
    quantity: int | None = Field(None, ge=0)  # Разрешаем 0 для списания
    hours: int | None = Field(None, ge=1)
    comment: str | None = None
    status: Literal["pending", "completed", "cancelled"] | None = None


class Payment(PaymentBase):
    id: int
    public_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


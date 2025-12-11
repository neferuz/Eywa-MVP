from __future__ import annotations

from pydantic import BaseModel


class PaymentServiceCategoryBase(BaseModel):
    name: str
    description: str | None = None
    accent: str = "#6366F1"


class PaymentServiceCategoryCreate(PaymentServiceCategoryBase):
    pass


class PaymentServiceCategoryUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    accent: str | None = None


class PaymentServiceCategory(PaymentServiceCategoryBase):
    id: int
    public_id: str

    class Config:
        from_attributes = True


class PaymentServiceBase(BaseModel):
    category_id: int
    name: str
    price: int
    price_label: str
    billing: str = "perService"  # perHour, perService, custom
    hint: str | None = None
    description: str | None = None
    duration: str | None = None
    trainer: str | None = None


class PaymentServiceCreate(PaymentServiceBase):
    pass


class PaymentServiceUpdate(BaseModel):
    category_id: int | None = None
    name: str | None = None
    price: int | None = None
    price_label: str | None = None
    billing: str | None = None
    hint: str | None = None
    description: str | None = None
    duration: str | None = None
    trainer: str | None = None


class PaymentService(PaymentServiceBase):
    id: int
    public_id: str

    class Config:
        from_attributes = True


from __future__ import annotations

from pydantic import BaseModel, Field


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
    price: int = Field(..., description="Стоимость услуги в сумах")
    price_label: str = Field(..., description="Метка цены (генерируется автоматически на основе цены, например: '200 000 сум')")
    billing: str = Field(default="perService", description="Тип оплаты (не используется в форме создания/редактирования, значение по умолчанию: perService)")
    hint: str | None = None
    description: str | None = None
    duration: str | None = Field(None, description="Длительность в виде количества занятий/визитов (например: '12 занятий', '8 визитов')")
    trainer: str | None = Field(None, description="Тренер (не используется в форме создания/редактирования)")


class PaymentServiceCreate(PaymentServiceBase):
    pass


class PaymentServiceUpdate(BaseModel):
    """Схема для обновления услуги.
    
    Примечание: поля `billing` и `trainer` не используются в форме редактирования
    и могут быть опущены при обновлении.
    """
    category_id: int | None = None
    name: str | None = None
    price: int | None = None
    price_label: str | None = Field(None, description="Метка цены (генерируется автоматически на основе цены)")
    billing: str | None = Field(None, description="Тип оплаты (не используется в форме редактирования)")
    hint: str | None = None
    description: str | None = None
    duration: str | None = Field(None, description="Длительность в виде количества занятий/визитов (например: '12 занятий', '8 визитов')")
    trainer: str | None = Field(None, description="Тренер (не используется в форме редактирования)")


class PaymentService(PaymentServiceBase):
    id: int
    public_id: str

    class Config:
        from_attributes = True


from __future__ import annotations

from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field, ConfigDict, field_validator


class ClientStatus(str, Enum):
    ACTIVE = "Активный"
    NEW = "Новый"
    CHURNED = "Ушедший"


class ClientDirection(str, Enum):
    BODY = "Body"
    COWORKING = "Coworking"
    COFFEE = "Coffee"
    PILATES_REFORMER = "Pilates Reformer"


class Subscription(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(..., description="Subscription name")
    validTill: str = Field(..., alias="valid_till", description="ISO date string when the sub expires")


class Client(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    phone: str
    contractNumber: str | None = Field(default=None, alias="contract_number")
    subscriptionNumber: str | None = Field(default=None, alias="subscription_number")
    birthDate: str | None = Field(default=None, alias="birth_date")
    instagram: str | None = None
    source: Literal["Instagram", "Telegram", "Рекомендации", "Google"]
    direction: ClientDirection
    status: ClientStatus
    subscriptions: list[Subscription]
    visits: list[str]
    activationDate: str | None = Field(default=None, alias="activation_date")
    contraindications: str | None = None
    coachNotes: str | None = Field(default=None, alias="coach_notes")


class ClientCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str
    phone: str
    contractNumber: str | None = Field(default=None, alias="contract_number")
    subscriptionNumber: str | None = Field(default=None, alias="subscription_number")
    birthDate: str | None = Field(default=None, alias="birth_date")
    instagram: str | None = None
    source: Literal["Instagram", "Telegram", "Рекомендации", "Google"] = "Instagram"
    direction: ClientDirection | str = ClientDirection.BODY
    status: ClientStatus | str = ClientStatus.NEW
    contraindications: str | None = None
    coachNotes: str | None = Field(default=None, alias="coach_notes")
    
    @field_validator("direction", mode="before")
    @classmethod
    def validate_direction(cls, v):
        """Преобразуем строку в enum значение."""
        if isinstance(v, str):
            try:
                return ClientDirection(v)
            except ValueError:
                return ClientDirection.BODY
        return v
    
    @field_validator("status", mode="before")
    @classmethod
    def validate_status(cls, v):
        """Преобразуем строку в enum значение."""
        if isinstance(v, str):
            try:
                return ClientStatus(v)
            except ValueError:
                return ClientStatus.NEW
        return v


class ClientUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str | None = None
    phone: str | None = None
    contractNumber: str | None = Field(default=None, alias="contract_number")
    subscriptionNumber: str | None = Field(default=None, alias="subscription_number")
    birthDate: str | None = Field(default=None, alias="birth_date")
    instagram: str | None = None
    source: Literal["Instagram", "Telegram", "Рекомендации", "Google"] | None = None
    direction: ClientDirection | None = None
    status: ClientStatus | None = None
    contraindications: str | None = None
    coachNotes: str | None = Field(default=None, alias="coach_notes")


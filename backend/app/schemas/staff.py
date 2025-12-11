from typing import Annotated, Literal

from pydantic import BaseModel, EmailStr, Field

Role = Literal["super_admin", "admin", "manager"]


class StaffBase(BaseModel):
    name: str | None = Field(None, max_length=255)
    email: EmailStr
    role: Role = "manager"
    access: list[str] = Field(default_factory=list)
    is_active: bool = True


class StaffCreate(StaffBase):
    password: str = Field(..., min_length=6)


class StaffUpdate(BaseModel):
    name: str | None = Field(None, max_length=255)
    email: EmailStr | None = None
    password: str | None = Field(None, min_length=6)
    role: Role | None = None
    access: list[str] | None = None
    is_active: bool | None = None


class StaffResponse(StaffBase):
    id: int

    class Config:
        orm_mode = True



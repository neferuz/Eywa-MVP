from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.repositories.user import UserRepository
from app.schemas.staff import StaffCreate, StaffResponse, StaffUpdate

router = APIRouter()


@router.get("/staff", response_model=list[StaffResponse])
async def list_staff(session: AsyncSession = Depends(get_session)) -> list[StaffResponse]:
    repo = UserRepository(session)
    users = await repo.list()
    return users


@router.post("/staff", response_model=StaffResponse, status_code=201)
async def create_staff(
    payload: StaffCreate,
    session: AsyncSession = Depends(get_session),
) -> StaffResponse:
    repo = UserRepository(session)
    # Проверка на уникальность email
    existing = await repo.get_by_email(payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    user = await repo.create_full(
        email=payload.email,
        password=payload.password,
        name=payload.name,
        role=payload.role,
        access=payload.access or [],
        is_active=payload.is_active,
    )
    return user


@router.patch("/staff/{user_id}", response_model=StaffResponse)
async def update_staff(
    user_id: int,
    payload: StaffUpdate,
    session: AsyncSession = Depends(get_session),
) -> StaffResponse:
    repo = UserRepository(session)
    
    # Проверка существования пользователя
    user = await repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Проверка на уникальность email, если email меняется
    if payload.email and payload.email != user.email:
        existing = await repo.get_by_email(payload.email)
        if existing:
            raise HTTPException(status_code=400, detail="User with this email already exists")
    
    updated = await repo.update(
        user_id,
        email=payload.email,
        password=payload.password,
        name=payload.name,
        role=payload.role,
        access=payload.access,
        is_active=payload.is_active,
    )
    
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    
    return updated


@router.delete("/staff/{user_id}", status_code=204)
async def delete_staff(user_id: int, session: AsyncSession = Depends(get_session)):
    repo = UserRepository(session)
    deleted = await repo.delete(user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")
    return None



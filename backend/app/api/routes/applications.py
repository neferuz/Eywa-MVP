from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.application import (
    Application,
    ApplicationCreate,
    ApplicationUpdate,
    Platform,
    Stage,
)
from app.db.session import get_session
from app.repositories.application import ApplicationRepository

router = APIRouter()


@router.post("/applications", response_model=Application, status_code=201)
async def create_application(
    data: ApplicationCreate,
    session: AsyncSession = Depends(get_session),
) -> Application:
    """Создать новую заявку"""
    repo = ApplicationRepository(session)
    return await repo.create(data)


@router.get("/applications", response_model=list[Application])
async def list_applications(
    platform: Annotated[Platform | None, Query(description="Filter by platform")] = None,
    stage: Annotated[Stage | None, Query(description="Filter by stage")] = None,
    session: AsyncSession = Depends(get_session),
) -> list[Application]:
    """Получить список заявок с фильтрацией"""
    repo = ApplicationRepository(session)
    return await repo.list_applications(platform=platform, stage=stage)


@router.get("/applications/{application_id}", response_model=Application)
async def get_application(
    application_id: str,
    session: AsyncSession = Depends(get_session),
) -> Application:
    """Получить заявку по ID"""
    repo = ApplicationRepository(session)
    application = await repo.get_by_public_id(application_id)
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    return application


@router.patch("/applications/{application_id}", response_model=Application)
async def update_application(
    application_id: str,
    data: ApplicationUpdate,
    session: AsyncSession = Depends(get_session),
) -> Application:
    """Обновить заявку"""
    repo = ApplicationRepository(session)
    application = await repo.update(application_id, data)
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    return application


@router.get("/applications/telegram/{chat_id}", response_model=Application)
async def get_application_by_telegram(
    chat_id: int,
    session: AsyncSession = Depends(get_session),
) -> Application:
    """Получить заявку по Telegram chat_id"""
    repo = ApplicationRepository(session)
    application = await repo.get_by_telegram_chat_id(chat_id)
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    return application


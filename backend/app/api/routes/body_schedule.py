from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.body_schedule import BodyScheduleAnalytics
from app.db.session import get_session
from app.repositories.body_schedule import BodyScheduleRepository

router = APIRouter(prefix="/api/body/schedule", tags=["body-schedule"])


@router.get("/analytics", response_model=BodyScheduleAnalytics)
async def get_body_schedule_analytics(
    start_date: Annotated[
        str | None,
        Query(
            description="Start date filter (ISO format: YYYY-MM-DD). If not provided, uses current week Monday.",
            example="2025-01-13",
        ),
    ] = None,
    end_date: Annotated[
        str | None,
        Query(
            description="End date filter (ISO format: YYYY-MM-DD). If not provided, uses current week Sunday.",
            example="2025-01-19",
        ),
    ] = None,
    session: AsyncSession = Depends(get_session),
) -> BodyScheduleAnalytics:
    """
    Получить аналитику по расписанию BODY.
    
    Возвращает:
    - Общую статистику (всего слотов, забронировано, загрузка)
    - Аналитику по группам (BODY и REFORM)
    - Загрузку тренеров
    - Загрузку залов
    
    Если даты не указаны, используется текущая неделя (понедельник - воскресенье).
    """
    repo = BodyScheduleRepository(session)
    
    start_date_obj = date.fromisoformat(start_date) if start_date else None
    end_date_obj = date.fromisoformat(end_date) if end_date else None
    
    return await repo.get_analytics(start_date=start_date_obj, end_date=end_date_obj)


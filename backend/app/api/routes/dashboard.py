from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.dashboard import DashboardSummary
from app.schemas.booking import TodayBooking
from app.data.dashboard import SUMMARY
from app.data.bookings import TODAY_BOOKINGS
from app.db.session import get_session
from app.repositories.dashboard import DashboardRepository

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    session: AsyncSession = Depends(get_session),
) -> DashboardSummary:
    repo = DashboardRepository(session)
    summary = await repo.fetch_summary()
    if summary:
        return summary
    return SUMMARY


@router.get("/today-bookings", response_model=list[TodayBooking])
async def get_today_bookings(
    session: AsyncSession = Depends(get_session),
) -> list[TodayBooking]:
    repo = DashboardRepository(session)
    records = await repo.fetch_today_bookings()
    if records:
        return records
    return TODAY_BOOKINGS


from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.repositories.marketing import MarketingRepository
from app.schemas.marketing import MarketingTrafficResponse, MarketingConversionsResponse


router = APIRouter(prefix="/api/marketing", tags=["marketing"])


@router.get("/traffic", response_model=MarketingTrafficResponse)
async def get_marketing_traffic(
    session: AsyncSession = Depends(get_session),
) -> MarketingTrafficResponse:
    repo = MarketingRepository(session)
    return await repo.fetch_traffic()


@router.get("/conversions", response_model=MarketingConversionsResponse)
async def get_marketing_conversions(
    session: AsyncSession = Depends(get_session),
) -> MarketingConversionsResponse:
    repo = MarketingRepository(session)
    return await repo.fetch_conversions()



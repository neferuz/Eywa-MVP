from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.repositories.services import ServiceRepository
from app.schemas.service import Service, ServiceCreate, ServiceUpdate

router = APIRouter(prefix="/api/services", tags=["services"])


@router.get("", response_model=list[Service])
async def list_services(session: AsyncSession = Depends(get_session)) -> list[Service]:
    repo = ServiceRepository(session)
    return await repo.list_services()


@router.post("", response_model=Service, status_code=status.HTTP_201_CREATED)
async def create_service(
    payload: ServiceCreate,
    session: AsyncSession = Depends(get_session),
) -> Service:
    repo = ServiceRepository(session)
    return await repo.create_service(payload)


@router.patch("/{service_id}", response_model=Service)
async def update_service(
    service_id: str,
    payload: ServiceUpdate,
    session: AsyncSession = Depends(get_session),
) -> Service:
    repo = ServiceRepository(session)
    service = await repo.update_service(service_id, payload)
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    return service


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(
    service_id: str,
    session: AsyncSession = Depends(get_session),
) -> None:
    repo = ServiceRepository(session)
    deleted = await repo.delete_service(service_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")


from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.repositories.coworking_places import CoworkingPlaceRepository
from app.schemas.coworking_place import CoworkingPlace, CoworkingPlaceCreate, CoworkingPlaceUpdate


router = APIRouter(prefix="/api/coworking/places", tags=["coworking"])


@router.get("", response_model=list[CoworkingPlace])
async def list_coworking_places(session: AsyncSession = Depends(get_session)) -> list[CoworkingPlace]:
    repo = CoworkingPlaceRepository(session)
    return await repo.list_places()


@router.post("", response_model=CoworkingPlace, status_code=status.HTTP_201_CREATED)
async def create_coworking_place(
    payload: CoworkingPlaceCreate,
    session: AsyncSession = Depends(get_session),
) -> CoworkingPlace:
    repo = CoworkingPlaceRepository(session)
    return await repo.create_place(payload)


@router.patch("/{place_id}", response_model=CoworkingPlace)
async def update_coworking_place(
    place_id: str,
    payload: CoworkingPlaceUpdate,
    session: AsyncSession = Depends(get_session),
) -> CoworkingPlace:
    repo = CoworkingPlaceRepository(session)
    place = await repo.update_place(place_id, payload)
    if not place:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")
    return place


@router.delete("/{place_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_coworking_place(
    place_id: str,
    session: AsyncSession = Depends(get_session),
) -> None:
    repo = CoworkingPlaceRepository(session)
    deleted = await repo.delete_place(place_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")


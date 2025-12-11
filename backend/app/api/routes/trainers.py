from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.repositories.trainers import TrainerRepository
from app.schemas.trainer import Trainer, TrainerCreate

router = APIRouter(prefix="/api/trainers", tags=["trainers"])


@router.get("", response_model=list[Trainer])
async def list_trainers(session: AsyncSession = Depends(get_session)) -> list[Trainer]:
    repo = TrainerRepository(session)
    return await repo.list()


@router.post("", response_model=Trainer, status_code=status.HTTP_201_CREATED)
async def create_trainer(
    payload: TrainerCreate,
    session: AsyncSession = Depends(get_session),
) -> Trainer:
    repo = TrainerRepository(session)
    return await repo.create(payload)


@router.get("/{trainer_id}", response_model=Trainer)
async def get_trainer(
    trainer_id: str, session: AsyncSession = Depends(get_session)
) -> Trainer:
    repo = TrainerRepository(session)
    trainer = await repo.get_by_public_id(trainer_id)
    if not trainer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trainer not found")
    return trainer


@router.delete("/{trainer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trainer(trainer_id: str, session: AsyncSession = Depends(get_session)) -> None:
    repo = TrainerRepository(session)
    deleted = await repo.delete(trainer_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trainer not found")



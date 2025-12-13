from __future__ import annotations

from uuid import uuid4

from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.trainers import MOCK_TRAINERS, get_mock_trainer
from app.models.trainer import Trainer as TrainerModel
from app.schemas.trainer import Trainer as TrainerSchema
from app.schemas.trainer import TrainerCreate, TrainerUpdate


class TrainerRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    def _base_query(self) -> Select[tuple[TrainerModel]]:
        return select(TrainerModel)

    async def list(self) -> list[TrainerSchema]:
        result = await self.session.scalars(self._base_query())
        rows = result.all()
        if not rows:
            return MOCK_TRAINERS
        return [self._to_schema(obj) for obj in rows]

    async def get_by_public_id(self, public_id: str) -> TrainerSchema | None:
        stmt = select(TrainerModel).where(TrainerModel.public_id == public_id)
        model = await self.session.scalar(stmt)
        if model:
            return self._to_schema(model)
        return get_mock_trainer(public_id)

    async def create(self, data: TrainerCreate) -> TrainerSchema:
        model = TrainerModel(
            public_id=str(uuid4()),
            full_name=data.full_name,
            phone=data.phone,
            directions=data.directions,
            schedule=data.schedule,
            comment=data.comment,
        )
        self.session.add(model)
        await self.session.commit()
        await self.session.refresh(model)
        return self._to_schema(model)

    async def update(self, public_id: str, data: TrainerUpdate) -> TrainerSchema | None:
        stmt = select(TrainerModel).where(TrainerModel.public_id == public_id)
        model = await self.session.scalar(stmt)
        if not model:
            return None
        
        if data.full_name is not None:
            model.full_name = data.full_name
        if data.phone is not None:
            model.phone = data.phone
        if data.directions is not None:
            model.directions = data.directions
        if data.schedule is not None:
            model.schedule = data.schedule
        if data.comment is not None:
            model.comment = data.comment
        
        await self.session.commit()
        await self.session.refresh(model)
        return self._to_schema(model)

    async def delete(self, public_id: str) -> bool:
        stmt = select(TrainerModel).where(TrainerModel.public_id == public_id)
        model = await self.session.scalar(stmt)
        if not model:
            return False
        await self.session.delete(model)
        await self.session.commit()
        return True

    @staticmethod
    def _to_schema(model: TrainerModel) -> TrainerSchema:
        return TrainerSchema(
            id=model.public_id,
            full_name=model.full_name,
            phone=model.phone,
            directions=model.directions,
            schedule=model.schedule,
            comment=model.comment,
        )










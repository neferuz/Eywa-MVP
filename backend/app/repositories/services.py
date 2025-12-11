from __future__ import annotations

from uuid import uuid4

from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.service import Service as ServiceModel
from app.schemas.service import Service as ServiceSchema
from app.schemas.service import ServiceCreate, ServiceUpdate


class ServiceRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    def _base_query(self) -> Select[tuple[ServiceModel]]:
        return select(ServiceModel)

    async def list_services(self) -> list[ServiceSchema]:
        result = await self.session.scalars(self._base_query())
        rows = result.all()
        return [self._to_schema(obj) for obj in rows]

    async def get_by_public_id(self, public_id: str) -> ServiceSchema | None:
        stmt = select(ServiceModel).where(ServiceModel.public_id == public_id)
        model = await self.session.scalar(stmt)
        if model:
            return self._to_schema(model)
        return None

    async def create_service(self, data: ServiceCreate) -> ServiceSchema:
        model = ServiceModel(
            public_id=str(uuid4()),
            name=data.name,
            category=data.category,
            direction=data.direction,
            duration_minutes=data.duration_minutes,
            price=data.price,
            description=data.description,
        )
        self.session.add(model)
        await self.session.commit()
        await self.session.refresh(model)
        return self._to_schema(model)

    async def update_service(self, public_id: str, data: ServiceUpdate) -> ServiceSchema | None:
        stmt = select(ServiceModel).where(ServiceModel.public_id == public_id)
        model = await self.session.scalar(stmt)
        if not model:
            return None
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(model, field, value)
        await self.session.commit()
        await self.session.refresh(model)
        return self._to_schema(model)

    async def delete_service(self, public_id: str) -> None:
        stmt = select(ServiceModel).where(ServiceModel.public_id == public_id)
        model = await self.session.scalar(stmt)
        if model:
            await self.session.delete(model)
            await self.session.commit()

    def _to_schema(self, model: ServiceModel) -> ServiceSchema:
        return ServiceSchema.model_validate(model)

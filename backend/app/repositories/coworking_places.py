from __future__ import annotations

from uuid import uuid4

from sqlalchemy import Select, select
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.coworking_places import MOCK_PLACES, get_mock_place
from app.models.coworking_place import CoworkingPlace as CoworkingPlaceModel
from app.schemas.coworking_place import CoworkingPlace, CoworkingPlaceCreate, CoworkingPlaceUpdate


class CoworkingPlaceRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    def _base_query(self) -> Select[tuple[CoworkingPlaceModel]]:
        return select(CoworkingPlaceModel)

    async def list_places(self) -> list[CoworkingPlace]:
        try:
            result = await self.session.scalars(self._base_query())
            rows = result.all()
            if not rows:
                return MOCK_PLACES
            return [self._to_schema(obj) for obj in rows]
        except ProgrammingError:
            return MOCK_PLACES

    async def get_by_public_id(self, public_id: str) -> CoworkingPlace | None:
        try:
            stmt = select(CoworkingPlaceModel).where(CoworkingPlaceModel.public_id == public_id)
            model = await self.session.scalar(stmt)
            if model:
                return self._to_schema(model)
        except ProgrammingError:
            pass
        return get_mock_place(public_id)

    async def create_place(self, data: CoworkingPlaceCreate) -> CoworkingPlace:
        try:
            model = CoworkingPlaceModel(
                public_id=str(uuid4()),
                name=data.name,
                description=data.description,
                type=data.type,
                seats=data.seats,
                price_1h=data.price_1h,
                price_3h=data.price_3h,
                price_day=data.price_day,
                price_month=data.price_month,
            )
            self.session.add(model)
            await self.session.commit()
            await self.session.refresh(model)
            return self._to_schema(model)
        except ProgrammingError:
            mock = CoworkingPlace(
                id=str(uuid4()),
                name=data.name,
                description=data.description,
                type=data.type,
                seats=data.seats,
                price_1h=data.price_1h,
                price_3h=data.price_3h,
                price_day=data.price_day,
                price_month=data.price_month,
            )
            MOCK_PLACES.insert(0, mock)
            return mock

    async def update_place(self, public_id: str, data: CoworkingPlaceUpdate) -> CoworkingPlace | None:
        try:
            stmt = select(CoworkingPlaceModel).where(CoworkingPlaceModel.public_id == public_id)
            model = await self.session.scalar(stmt)
            if not model:
                existing = get_mock_place(public_id)
                if not existing:
                    return None
                payload = data.model_dump(exclude_unset=True)
                for field, value in payload.items():
                    setattr(existing, field, value)
                return existing

            payload = data.model_dump(exclude_unset=True)
            for field, value in payload.items():
                setattr(model, field, value)

            await self.session.commit()
            await self.session.refresh(model)
            return self._to_schema(model)
        except ProgrammingError:
            existing = get_mock_place(public_id)
            if not existing:
                return None
            payload = data.model_dump(exclude_unset=True)
            for field, value in payload.items():
                setattr(existing, field, value)
            return existing

    async def delete_place(self, public_id: str) -> bool:
        try:
            stmt = select(CoworkingPlaceModel).where(CoworkingPlaceModel.public_id == public_id)
            model = await self.session.scalar(stmt)
            if not model:
                idx = next((i for i, place in enumerate(MOCK_PLACES) if place.id == public_id), None)
                if idx is None:
                    return False
                MOCK_PLACES.pop(idx)
                return True

            await self.session.delete(model)
            await self.session.commit()
            return True
        except ProgrammingError:
            idx = next((i for i, place in enumerate(MOCK_PLACES) if place.id == public_id), None)
            if idx is None:
                return False
            MOCK_PLACES.pop(idx)
            return True

    @staticmethod
    def _to_schema(model: CoworkingPlaceModel) -> CoworkingPlace:
        return CoworkingPlace(
            id=model.public_id,
            name=model.name,
            description=model.description,
            type=model.type,
            seats=model.seats,
            price_1h=model.price_1h,
            price_3h=model.price_3h,
            price_day=model.price_day,
            price_month=model.price_month,
        )


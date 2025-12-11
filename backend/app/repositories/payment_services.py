from __future__ import annotations

from uuid import uuid4

from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payment_service import PaymentService as PaymentServiceModel, PaymentServiceCategory as PaymentServiceCategoryModel
from app.schemas.payment_service import (
    PaymentService as PaymentServiceSchema,
    PaymentServiceCreate,
    PaymentServiceUpdate,
    PaymentServiceCategory as PaymentServiceCategorySchema,
    PaymentServiceCategoryCreate,
    PaymentServiceCategoryUpdate,
)


class PaymentServiceCategoryRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    def _base_query(self) -> Select[tuple[PaymentServiceCategoryModel]]:
        return select(PaymentServiceCategoryModel).order_by(PaymentServiceCategoryModel.name)

    async def list_categories(self) -> list[PaymentServiceCategorySchema]:
        result = await self.session.scalars(self._base_query())
        rows = result.all()
        return [self._to_schema(obj) for obj in rows]

    async def get_by_public_id(self, public_id: str) -> PaymentServiceCategorySchema | None:
        stmt = select(PaymentServiceCategoryModel).where(PaymentServiceCategoryModel.public_id == public_id)
        model = await self.session.scalar(stmt)
        if model:
            return self._to_schema(model)
        return None

    async def get_by_id(self, id: int) -> PaymentServiceCategorySchema | None:
        stmt = select(PaymentServiceCategoryModel).where(PaymentServiceCategoryModel.id == id)
        model = await self.session.scalar(stmt)
        if model:
            return self._to_schema(model)
        return None

    async def create_category(self, data: PaymentServiceCategoryCreate) -> PaymentServiceCategorySchema:
        model = PaymentServiceCategoryModel(
            public_id=str(uuid4()),
            name=data.name,
            description=data.description,
            accent=data.accent,
        )
        self.session.add(model)
        await self.session.commit()
        await self.session.refresh(model)
        return self._to_schema(model)

    async def update_category(self, public_id: str, data: PaymentServiceCategoryUpdate) -> PaymentServiceCategorySchema | None:
        stmt = select(PaymentServiceCategoryModel).where(PaymentServiceCategoryModel.public_id == public_id)
        model = await self.session.scalar(stmt)
        if not model:
            return None

        if data.name is not None:
            model.name = data.name
        if data.description is not None:
            model.description = data.description
        if data.accent is not None:
            model.accent = data.accent

        await self.session.commit()
        await self.session.refresh(model)
        return self._to_schema(model)

    async def delete_category(self, public_id: str) -> bool:
        stmt = select(PaymentServiceCategoryModel).where(PaymentServiceCategoryModel.public_id == public_id)
        model = await self.session.scalar(stmt)
        if not model:
            return False

        await self.session.delete(model)
        await self.session.commit()
        return True

    def _to_schema(self, model: PaymentServiceCategoryModel) -> PaymentServiceCategorySchema:
        return PaymentServiceCategorySchema(
            id=model.id,
            public_id=model.public_id,
            name=model.name,
            description=model.description,
            accent=model.accent,
        )


class PaymentServiceRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    def _base_query(self) -> Select[tuple[PaymentServiceModel]]:
        return select(PaymentServiceModel).order_by(PaymentServiceModel.name)

    async def list_services(self) -> list[PaymentServiceSchema]:
        result = await self.session.scalars(self._base_query())
        rows = result.all()
        return [self._to_schema(obj) for obj in rows]

    async def list_services_by_category(self, category_id: int) -> list[PaymentServiceSchema]:
        stmt = select(PaymentServiceModel).where(PaymentServiceModel.category_id == category_id).order_by(PaymentServiceModel.name)
        result = await self.session.scalars(stmt)
        rows = result.all()
        return [self._to_schema(obj) for obj in rows]

    async def get_by_public_id(self, public_id: str) -> PaymentServiceSchema | None:
        stmt = select(PaymentServiceModel).where(PaymentServiceModel.public_id == public_id)
        model = await self.session.scalar(stmt)
        if model:
            return self._to_schema(model)
        return None

    async def create_service(self, data: PaymentServiceCreate) -> PaymentServiceSchema:
        model = PaymentServiceModel(
            public_id=str(uuid4()),
            category_id=data.category_id,
            name=data.name,
            price=data.price,
            price_label=data.price_label,
            billing=data.billing,
            hint=data.hint,
            description=data.description,
            duration=data.duration,
            trainer=data.trainer,
        )
        self.session.add(model)
        await self.session.commit()
        await self.session.refresh(model)
        return self._to_schema(model)

    async def update_service(self, public_id: str, data: PaymentServiceUpdate) -> PaymentServiceSchema | None:
        stmt = select(PaymentServiceModel).where(PaymentServiceModel.public_id == public_id)
        model = await self.session.scalar(stmt)
        if not model:
            return None

        if data.category_id is not None:
            model.category_id = data.category_id
        if data.name is not None:
            model.name = data.name
        if data.price is not None:
            model.price = data.price
        if data.price_label is not None:
            model.price_label = data.price_label
        if data.billing is not None:
            model.billing = data.billing
        if data.hint is not None:
            model.hint = data.hint
        if data.description is not None:
            model.description = data.description
        if data.duration is not None:
            model.duration = data.duration
        if data.trainer is not None:
            model.trainer = data.trainer

        await self.session.commit()
        await self.session.refresh(model)
        return self._to_schema(model)

    async def delete_service(self, public_id: str) -> bool:
        stmt = select(PaymentServiceModel).where(PaymentServiceModel.public_id == public_id)
        model = await self.session.scalar(stmt)
        if not model:
            return False

        await self.session.delete(model)
        await self.session.commit()
        return True

    def _to_schema(self, model: PaymentServiceModel) -> PaymentServiceSchema:
        return PaymentServiceSchema(
            id=model.id,
            public_id=model.public_id,
            category_id=model.category_id,
            name=model.name,
            price=model.price,
            price_label=model.price_label,
            billing=model.billing,
            hint=model.hint,
            description=model.description,
            duration=model.duration,
            trainer=model.trainer,
        )


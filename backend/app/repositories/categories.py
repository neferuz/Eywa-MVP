from __future__ import annotations

from uuid import uuid4

from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category as CategoryModel
from app.schemas.category import Category as CategorySchema, CategoryCreate, CategoryUpdate


class CategoryRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    def _base_query(self) -> Select[tuple[CategoryModel]]:
        return select(CategoryModel).order_by(CategoryModel.name)

    async def list_categories(self) -> list[CategorySchema]:
        result = await self.session.scalars(self._base_query())
        rows = result.all()
        return [self._to_schema(obj) for obj in rows]

    async def get_by_public_id(self, public_id: str) -> CategorySchema | None:
        stmt = select(CategoryModel).where(CategoryModel.public_id == public_id)
        model = await self.session.scalar(stmt)
        if model:
            return self._to_schema(model)
        return None

    async def get_by_name(self, name: str) -> CategorySchema | None:
        stmt = select(CategoryModel).where(CategoryModel.name == name)
        model = await self.session.scalar(stmt)
        if model:
            return self._to_schema(model)
        return None

    async def create_category(self, data: CategoryCreate) -> CategorySchema:
        model = CategoryModel(
            public_id=str(uuid4()),
            name=data.name,
            icon=data.icon,
            accent=data.accent,
        )
        self.session.add(model)
        await self.session.commit()
        await self.session.refresh(model)
        return self._to_schema(model)

    async def update_category(self, public_id: str, data: CategoryUpdate) -> CategorySchema | None:
        stmt = select(CategoryModel).where(CategoryModel.public_id == public_id)
        model = await self.session.scalar(stmt)
        if not model:
            return None

        payload = data.model_dump(exclude_unset=True)
        for field, value in payload.items():
            setattr(model, field, value)

        await self.session.commit()
        await self.session.refresh(model)
        return self._to_schema(model)

    async def delete_category(self, public_id: str) -> bool:
        stmt = select(CategoryModel).where(CategoryModel.public_id == public_id)
        model = await self.session.scalar(stmt)
        if not model:
            return False

        await self.session.delete(model)
        await self.session.flush()
        await self.session.commit()
        return True

    @staticmethod
    def _to_schema(model: CategoryModel) -> CategorySchema:
        return CategorySchema(
            id=model.public_id,
            name=model.name,
            icon=model.icon,
            accent=model.accent,
        )


from __future__ import annotations

from uuid import uuid4

from sqlalchemy import Select, select, delete, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payment import Payment as PaymentModel
from app.schemas.payment import (
    Payment as PaymentSchema,
    PaymentCreate,
    PaymentUpdate,
)


class PaymentRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    def _base_query(self) -> Select[tuple[PaymentModel]]:
        return select(PaymentModel).order_by(desc(PaymentModel.created_at))

    def _to_schema(self, model: PaymentModel) -> PaymentSchema:
        return PaymentSchema.model_validate(model)

    async def list_payments(
        self,
        skip: int = 0,
        limit: int = 100,
        service_name: str | None = None,
        client_id: str | None = None,
    ) -> list[PaymentSchema]:
        stmt = self._base_query()
        
        if service_name:
            stmt = stmt.where(PaymentModel.service_name.ilike(f"%{service_name}%"))
        if client_id:
            stmt = stmt.where(PaymentModel.client_id == client_id)
        
        stmt = stmt.offset(skip).limit(limit)
        result = await self.session.scalars(stmt)
        rows = result.all()
        return [self._to_schema(obj) for obj in rows]

    async def get_by_public_id(self, public_id: str) -> PaymentSchema | None:
        stmt = select(PaymentModel).where(PaymentModel.public_id == public_id)
        model = await self.session.scalar(stmt)
        if model:
            return self._to_schema(model)
        return None

    async def create_payment(self, data: PaymentCreate) -> PaymentSchema:
        model = PaymentModel(
            public_id=str(uuid4()),
            client_id=data.client_id,
            client_name=data.client_name,
            client_phone=data.client_phone,
            service_id=data.service_id,
            service_name=data.service_name,
            service_category=data.service_category,
            total_amount=data.total_amount,
            cash_amount=data.cash_amount,
            transfer_amount=data.transfer_amount,
            quantity=data.quantity,
            hours=data.hours,
            comment=data.comment,
            status=data.status,
        )
        self.session.add(model)
        await self.session.commit()
        await self.session.refresh(model)
        return self._to_schema(model)

    async def update_payment(
        self, public_id: str, data: PaymentUpdate
    ) -> PaymentSchema | None:
        stmt = select(PaymentModel).where(PaymentModel.public_id == public_id)
        model = await self.session.scalar(stmt)
        if model:
            for field, value in data.model_dump(exclude_unset=True).items():
                setattr(model, field, value)
            await self.session.commit()
            await self.session.refresh(model)
            return self._to_schema(model)
        return None

    async def delete_payment(self, public_id: str) -> None:
        stmt = delete(PaymentModel).where(PaymentModel.public_id == public_id)
        await self.session.execute(stmt)
        await self.session.commit()


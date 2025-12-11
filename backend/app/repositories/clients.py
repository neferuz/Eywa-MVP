from __future__ import annotations

from typing import Literal

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from uuid import uuid4

from app.data.clients import CLIENTS as MOCK_CLIENTS, get_mock_client
from app.models.client import Client as ClientModel
from app.schemas.client import Client as ClientSchema, ClientCreate, ClientUpdate


class ClientRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    def _base_query(self) -> Select[tuple[ClientModel]]:
        return select(ClientModel)

    def _apply_filters(
        self,
        stmt: Select[tuple[ClientModel]],
        query: str | None,
        direction: Literal["Body", "Coworking", "Coffee"] | None,
        status: Literal["Активный", "Новый", "Ушедший"] | None,
    ) -> Select[tuple[ClientModel]]:
        conditions = []
        if query:
            like = f"%{query.lower()}%"
            digits = "".join(filter(str.isdigit, query))
            conditions.append(func.lower(ClientModel.name).like(like))
            conditions.append(func.replace(ClientModel.phone, " ", "").like(f"%{digits}%"))
            conditions.append(func.lower(func.coalesce(ClientModel.instagram, "")).like(like))
            stmt = stmt.where(or_(*conditions))
        if direction:
            stmt = stmt.where(ClientModel.direction == direction)
        if status:
            stmt = stmt.where(ClientModel.status == status)
        return stmt

    async def list_clients(
        self,
        query: str | None,
        direction: Literal["Body", "Coworking", "Coffee"] | None,
        status: Literal["Активный", "Новый", "Ушедший"] | None,
    ) -> list[ClientSchema]:
        stmt = self._apply_filters(self._base_query(), query, direction, status)
        result = await self.session.scalars(stmt)
        rows = result.all()
        if not rows:
            return self._filter_mock_clients(query, direction, status)
        return [self._to_schema(obj) for obj in rows]

    async def get_by_public_id(self, public_id: str) -> ClientSchema | None:
        stmt = select(ClientModel).where(ClientModel.public_id == public_id)
        result = await self.session.scalar(stmt)
        if result:
            return self._to_schema(result)
        return get_mock_client(public_id)

    def _filter_mock_clients(
        self,
        query: str | None,
        direction: Literal["Body", "Coworking", "Coffee"] | None,
        status: Literal["Активный", "Новый", "Ушедший"] | None,
    ) -> list[ClientSchema]:
        def matches(client: ClientSchema) -> bool:
            if query:
                q = query.lower()
                normalized_phone = "".join(filter(str.isdigit, client.phone))
                normalized_query = "".join(filter(str.isdigit, q))
                if not (
                    q in client.name.lower()
                    or (normalized_query and normalized_query in normalized_phone)
                    or (client.instagram or "").lower().lstrip("@").startswith(q.lstrip("@"))
                ):
                    return False
            if direction and client.direction != direction:
                return False
            if status and client.status != status:
                return False
            return True

        return [client for client in MOCK_CLIENTS if matches(client)]

    async def create_client(self, data: ClientCreate) -> ClientSchema:
        try:
            model = ClientModel(
                public_id=str(uuid4()),
                name=data.name,
                phone=data.phone,
                instagram=data.instagram,
                source=data.source,
                direction=data.direction.value,
                status=data.status.value,
                contraindications=data.contraindications,
                coach_notes=data.coachNotes,
            )
            self.session.add(model)
            await self.session.commit()
            await self.session.refresh(model)
            return self._to_schema(model)
        except Exception:
            await self.session.rollback()
            raise

    async def update_client(self, public_id: str, data: ClientUpdate) -> ClientSchema | None:
        try:
            stmt = select(ClientModel).where(ClientModel.public_id == public_id)
            model = await self.session.scalar(stmt)
            if not model:
                return None

            if data.name is not None:
                model.name = data.name
            if data.phone is not None:
                model.phone = data.phone
            if data.instagram is not None:
                model.instagram = data.instagram
            if data.source is not None:
                model.source = data.source
            if data.direction is not None:
                model.direction = data.direction.value
            if data.status is not None:
                model.status = data.status.value
            if data.contraindications is not None:
                model.contraindications = data.contraindications
            if data.coachNotes is not None:
                model.coach_notes = data.coachNotes

            await self.session.commit()
            await self.session.refresh(model)
            return self._to_schema(model)
        except Exception:
            await self.session.rollback()
            raise

    @staticmethod
    def _to_schema(model: ClientModel) -> ClientSchema:
        return ClientSchema(
            id=model.public_id,
            name=model.name,
            phone=model.phone,
            contractNumber=None,
            subscriptionNumber=None,
            birthDate=None,
            instagram=model.instagram,
            source=model.source,  # type: ignore[arg-type]
            direction=model.direction,  # type: ignore[arg-type]
            status=model.status,  # type: ignore[arg-type]
            subscriptions=[],
            visits=[],
            activationDate=None,
            contraindications=model.contraindications,
            coachNotes=model.coach_notes,
        )


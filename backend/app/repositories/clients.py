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
        # Применяем фильтр по query только если он не пустой и не None
        if query and query.strip():
            query_trimmed = query.strip()
            # Используем ILIKE для case-insensitive поиска (работает лучше с кириллицей)
            like_pattern = f"%{query_trimmed}%"
            digits = "".join(filter(str.isdigit, query_trimmed))
            
            conditions = []
            # Поиск по имени (case-insensitive через ILIKE)
            conditions.append(ClientModel.name.ilike(like_pattern))
            # Поиск по телефону (только если есть цифры)
            if digits:
                conditions.append(func.replace(ClientModel.phone, " ", "").like(f"%{digits}%"))
            # Поиск по инстаграму (case-insensitive через ILIKE)
            conditions.append(func.coalesce(ClientModel.instagram, "").ilike(like_pattern))
            
            # Применяем OR условие - клиент должен соответствовать хотя бы одному из условий
            stmt = stmt.where(or_(*conditions))
        
        # Применяем фильтр по direction
        if direction:
            stmt = stmt.where(ClientModel.direction == direction)
        
        # Применяем фильтр по status
        if status:
            stmt = stmt.where(ClientModel.status == status)
        
        return stmt

    async def list_clients(
        self,
        query: str | None,
        direction: Literal["Body", "Coworking", "Coffee"] | None,
        status: Literal["Активный", "Новый", "Ушедший"] | None,
    ) -> list[ClientSchema]:
        # Если query пустой или None:
        # - Если есть фильтры (direction или status) - возвращаем всех клиентов с этими фильтрами
        # - Если нет фильтров - возвращаем всех клиентов (для страницы списка клиентов)
        if not query or not query.strip():
            # Нет поискового запроса - возвращаем всех клиентов (с фильтрами, если есть)
            stmt = self._apply_filters(self._base_query(), None, direction, status)
            result = await self.session.scalars(stmt)
            rows = result.all()
            return [self._to_schema(obj) for obj in rows]
        
        stmt = self._apply_filters(self._base_query(), query, direction, status)
        result = await self.session.scalars(stmt)
        rows = result.all()
        
        # Возвращаем только данные из базы, без fallback на мок-данные
        return [self._to_schema(obj) for obj in rows]

    async def get_by_public_id(self, public_id: str) -> ClientSchema | None:
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Fetching client by public_id: {public_id}")
        
        stmt = select(ClientModel).where(ClientModel.public_id == public_id)
        result = await self.session.scalar(stmt)
        if result:
            logger.info(f"Client found in DB: contract_number={result.contract_number}, subscription_number={result.subscription_number}, birth_date={result.birth_date}")
            schema = self._to_schema(result)
            logger.info(f"Returning schema: contractNumber={schema.contractNumber}, subscriptionNumber={schema.subscriptionNumber}, birthDate={schema.birthDate}")
            return schema
        # Возвращаем None вместо мок-данных - только реальные данные из базы
        logger.warning(f"Client not found: {public_id}")
        return None

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
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"Creating client: contractNumber={data.contractNumber}, subscriptionNumber={data.subscriptionNumber}, birthDate={data.birthDate}")
            
            model = ClientModel(
                public_id=str(uuid4()),
                name=data.name,
                phone=data.phone,
                contract_number=data.contractNumber,
                subscription_number=data.subscriptionNumber,
                birth_date=data.birthDate,
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
            
            logger.info(f"Client created in DB: public_id={model.public_id}, contract_number={model.contract_number}, subscription_number={model.subscription_number}, birth_date={model.birth_date}")
            
            result = self._to_schema(model)
            logger.info(f"Returning schema: contractNumber={result.contractNumber}, subscriptionNumber={result.subscriptionNumber}, birthDate={result.birthDate}")
            
            return result
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error creating client: {str(e)}", exc_info=True)
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
            if data.contractNumber is not None:
                model.contract_number = data.contractNumber
            if data.subscriptionNumber is not None:
                model.subscription_number = data.subscriptionNumber
            if data.birthDate is not None:
                model.birth_date = data.birthDate
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

    async def add_visit(self, public_id: str, visit_date: str | None = None) -> ClientSchema | None:
        """Добавить визит клиента. Если visit_date не указана, используется текущая дата."""
        from datetime import datetime
        
        stmt = select(ClientModel).where(ClientModel.public_id == public_id)
        model = await self.session.scalar(stmt)
        if not model:
            return None
        
        # Если visit_date не указана, используем текущую дату
        if not visit_date:
            visit_date = datetime.now().strftime("%Y-%m-%d")
        
        # Инициализируем visits, если его нет
        if model.visits is None:
            model.visits = []
        
        # Добавляем визит, если его еще нет
        if visit_date not in model.visits:
            model.visits.append(visit_date)
            model.visits.sort()  # Сортируем по дате
        
        # Устанавливаем activation_date, если его еще нет
        if not model.activation_date:
            model.activation_date = visit_date
        
        await self.session.commit()
        await self.session.refresh(model)
        return self._to_schema(model)

    async def remove_visit(self, public_id: str, visit_date: str) -> ClientSchema | None:
        """Удалить визит клиента по дате."""
        stmt = select(ClientModel).where(ClientModel.public_id == public_id)
        model = await self.session.scalar(stmt)
        if not model:
            return None
        
        # Инициализируем visits, если его нет
        if model.visits is None:
            model.visits = []
        
        # Удаляем визит, если он есть
        if visit_date in model.visits:
            model.visits.remove(visit_date)
            model.visits.sort()  # Сортируем по дате
        
        await self.session.commit()
        await self.session.refresh(model)
        return self._to_schema(model)

    @staticmethod
    def _to_schema(model: ClientModel) -> ClientSchema:
        import logging
        logger = logging.getLogger(__name__)
        
        # Логируем значения из модели
        logger.info(f"_to_schema: model.contract_number={model.contract_number}, model.subscription_number={model.subscription_number}, model.birth_date={model.birth_date}")
        
        result = ClientSchema(
            id=model.public_id,
            name=model.name,
            phone=model.phone,
            contractNumber=model.contract_number,
            subscriptionNumber=model.subscription_number,
            birthDate=model.birth_date,
            instagram=model.instagram,
            source=model.source,  # type: ignore[arg-type]
            direction=model.direction,  # type: ignore[arg-type]
            status=model.status,  # type: ignore[arg-type]
            subscriptions=[],
            visits=model.visits if model.visits else [],
            activationDate=model.activation_date,
            contraindications=model.contraindications,
            coachNotes=model.coach_notes,
        )
        
        # Логируем значения в результате
        logger.info(f"_to_schema result: contractNumber={result.contractNumber}, subscriptionNumber={result.subscriptionNumber}, birthDate={result.birthDate}")
        
        return result


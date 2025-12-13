from __future__ import annotations

from datetime import date, time
from typing import Literal

from sqlalchemy import Select, and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4

from app.models.schedule_booking import ScheduleBooking as ScheduleBookingModel
from app.schemas.schedule_booking import (
    ScheduleBooking as ScheduleBookingSchema,
    ScheduleBookingCreate,
    ScheduleBookingUpdate,
    ClientInfo,
)


class ScheduleBookingRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    def _base_query(self) -> Select[tuple[ScheduleBookingModel]]:
        return select(ScheduleBookingModel)

    async def list_bookings(
        self,
        start_date: date | None = None,
        end_date: date | None = None,
        category: str | None = None,
        trainer_id: str | None = None,
        status: Literal["Бронь", "Оплачено", "Свободно"] | None = None,
    ) -> list[ScheduleBookingSchema]:
        """Получить список записей с фильтрацией."""
        stmt = self._base_query()
        
        if start_date:
            stmt = stmt.where(ScheduleBookingModel.booking_date >= start_date)
        if end_date:
            stmt = stmt.where(ScheduleBookingModel.booking_date <= end_date)
        if category:
            stmt = stmt.where(ScheduleBookingModel.category == category)
        if trainer_id:
            stmt = stmt.where(ScheduleBookingModel.trainer_id == trainer_id)
        if status:
            stmt = stmt.where(ScheduleBookingModel.status == status)
        
        stmt = stmt.order_by(
            ScheduleBookingModel.booking_date,
            ScheduleBookingModel.booking_time
        )
        
        result = await self.session.scalars(stmt)
        rows = result.all()
        return [self._to_schema(obj) for obj in rows]

    async def get_by_public_id(self, public_id: str) -> ScheduleBookingSchema | None:
        """Получить запись по public_id."""
        stmt = select(ScheduleBookingModel).where(
            ScheduleBookingModel.public_id == public_id
        )
        result = await self.session.scalar(stmt)
        if result:
            return self._to_schema(result)
        return None

    async def get_by_date_and_time(
        self,
        booking_date: date,
        booking_time: time,
        category: str | None = None,
    ) -> list[ScheduleBookingSchema]:
        """Получить записи по дате и времени."""
        stmt = select(ScheduleBookingModel).where(
            and_(
                ScheduleBookingModel.booking_date == booking_date,
                ScheduleBookingModel.booking_time == booking_time,
            )
        )
        if category:
            stmt = stmt.where(ScheduleBookingModel.category == category)
        
        result = await self.session.scalars(stmt)
        rows = result.all()
        return [self._to_schema(obj) for obj in rows]

    async def create_booking(self, data: ScheduleBookingCreate) -> ScheduleBookingSchema:
        """Создать новую запись."""
        try:
            # Парсим дату и время
            booking_date_obj = date.fromisoformat(data.booking_date)
            time_parts = data.booking_time.split(":")
            booking_time_obj = time(int(time_parts[0]), int(time_parts[1]))
            
            # Преобразуем клиентов в формат для БД
            clients_data = [
                {
                    "client_id": client.client_id,
                    "client_name": client.client_name,
                    "client_phone": client.client_phone,
                }
                for client in data.clients
            ]
            
            # Проверка вместимости: нельзя добавить больше клиентов, чем max_capacity
            if len(clients_data) > data.max_capacity:
                from fastapi import HTTPException
                raise HTTPException(
                    status_code=400,
                    detail=f"Превышена вместимость: добавлено {len(clients_data)} клиентов, максимум {data.max_capacity}"
                )
            
            model = ScheduleBookingModel(
                public_id=str(uuid4()),
                booking_date=booking_date_obj,
                booking_time=booking_time_obj,
                category=data.category,
                service_name=data.service_name,
                trainer_id=data.trainer_id,
                trainer_name=data.trainer_name,
                clients=clients_data,
                max_capacity=data.max_capacity,
                current_count=len(clients_data),
                status=data.status.value,
                notes=data.notes,
                capsule_id=data.capsule_id,
                capsule_name=data.capsule_name,
            )
            self.session.add(model)
            await self.session.commit()
            await self.session.refresh(model)
            return self._to_schema(model)
        except Exception:
            await self.session.rollback()
            raise

    async def update_booking(
        self, public_id: str, data: ScheduleBookingUpdate
    ) -> ScheduleBookingSchema | None:
        """Обновить запись."""
        try:
            stmt = select(ScheduleBookingModel).where(
                ScheduleBookingModel.public_id == public_id
            )
            model = await self.session.scalar(stmt)
            if not model:
                return None

            if data.booking_date is not None:
                model.booking_date = date.fromisoformat(data.booking_date)
            if data.booking_time is not None:
                time_parts = data.booking_time.split(":")
                model.booking_time = time(int(time_parts[0]), int(time_parts[1]))
            if data.category is not None:
                model.category = data.category
            if data.service_name is not None:
                model.service_name = data.service_name
            if data.trainer_id is not None:
                model.trainer_id = data.trainer_id
            if data.trainer_name is not None:
                model.trainer_name = data.trainer_name
            if data.clients is not None:
                clients_data = [
                    {
                        "client_id": client.client_id,
                        "client_name": client.client_name,
                        "client_phone": client.client_phone,
                    }
                    for client in data.clients
                ]
                
                # Проверка вместимости: нельзя добавить больше клиентов, чем max_capacity
                max_cap = data.max_capacity if data.max_capacity is not None else model.max_capacity
                if len(clients_data) > max_cap:
                    from fastapi import HTTPException
                    raise HTTPException(
                        status_code=400,
                        detail=f"Превышена вместимость: добавлено {len(clients_data)} клиентов, максимум {max_cap}"
                    )
                
                model.clients = clients_data
                model.current_count = len(clients_data)
            if data.max_capacity is not None:
                # Если уменьшается вместимость, проверяем что текущее количество клиентов не превышает новую вместимость
                if model.current_count > data.max_capacity:
                    from fastapi import HTTPException
                    raise HTTPException(
                        status_code=400,
                        detail=f"Нельзя уменьшить вместимость до {data.max_capacity}: уже записано {model.current_count} клиентов"
                    )
                model.max_capacity = data.max_capacity
            if data.status is not None:
                model.status = data.status.value
            if data.notes is not None:
                model.notes = data.notes
            if data.capsule_id is not None:
                model.capsule_id = data.capsule_id
            if data.capsule_name is not None:
                model.capsule_name = data.capsule_name

            await self.session.commit()
            await self.session.refresh(model)
            return self._to_schema(model)
        except Exception:
            await self.session.rollback()
            raise

    async def delete_booking(self, public_id: str) -> bool:
        """Удалить запись."""
        try:
            stmt = select(ScheduleBookingModel).where(
                ScheduleBookingModel.public_id == public_id
            )
            model = await self.session.scalar(stmt)
            if not model:
                return False
            
            await self.session.delete(model)
            await self.session.commit()
            return True
        except Exception:
            await self.session.rollback()
            raise

    @staticmethod
    def _to_schema(model: ScheduleBookingModel) -> ScheduleBookingSchema:
        """Преобразовать модель в схему."""
        # Преобразуем клиентов из JSONB
        clients_list = [
            ClientInfo(
                client_id=client.get("client_id", ""),
                client_name=client.get("client_name", ""),
                client_phone=client.get("client_phone"),
            )
            for client in (model.clients or [])
        ]
        
        return ScheduleBookingSchema(
            id=model.public_id,
            booking_date=model.booking_date.isoformat(),
            booking_time=model.booking_time.strftime("%H:%M"),
            category=model.category,
            service_name=model.service_name,
            trainer_id=model.trainer_id,
            trainer_name=model.trainer_name,
            clients=clients_list,
            max_capacity=model.max_capacity,
            current_count=model.current_count,
            status=model.status,  # type: ignore[arg-type]
            notes=model.notes,
            capsule_id=model.capsule_id,
            capsule_name=model.capsule_name,
            created_at=model.created_at.isoformat() if model.created_at else None,
            updated_at=model.updated_at.isoformat() if model.updated_at else None,
        )


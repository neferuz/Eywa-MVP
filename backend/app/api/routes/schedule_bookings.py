from datetime import date
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import status

from app.schemas.schedule_booking import (
    ScheduleBooking,
    ScheduleBookingCreate,
    ScheduleBookingUpdate,
)
from app.db.session import get_session
from app.repositories.schedule_booking import ScheduleBookingRepository

router = APIRouter()


@router.get("/schedule/bookings", response_model=list[ScheduleBooking])
async def list_bookings(
    start_date: Annotated[
        str | None,
        Query(
            description="Start date filter (ISO format: YYYY-MM-DD)",
            example="2025-12-01",
        ),
    ] = None,
    end_date: Annotated[
        str | None,
        Query(
            description="End date filter (ISO format: YYYY-MM-DD)",
            example="2025-12-31",
        ),
    ] = None,
    category: Annotated[
        str | None,
        Query(
            description="Filter by category. Available categories: 'Body Mind', 'Pilates Reformer', 'Коворкинг', 'Eywa Kids'",
            example="Body Mind",
        ),
    ] = None,
    trainer_id: Annotated[
        str | None,
        Query(
            description="Filter by trainer ID",
            example="1cefeb98-9f2e-44fd-9566-8c1363212b4b",
        ),
    ] = None,
    booking_status: Annotated[
        Literal["Бронь", "Оплачено", "Свободно"] | None,
        Query(
            description="Filter by booking status",
            example="Свободно",
        ),
    ] = None,
    session: AsyncSession = Depends(get_session),
) -> list[ScheduleBooking]:
    """
    Получить список записей в расписании с опциональной фильтрацией.
    
    **Примеры использования:**
    - Получить все записи Body Mind: `/api/schedule/bookings?category=Body Mind`
    - Получить все записи Pilates Reformer: `/api/schedule/bookings?category=Pilates Reformer`
    - Получить все записи Коворкинг: `/api/schedule/bookings?category=Коворкинг`
    - Получить все записи Eywa Kids: `/api/schedule/bookings?category=Eywa Kids`
    - Получить записи за период: `/api/schedule/bookings?start_date=2025-12-01&end_date=2025-12-31`
    - Получить записи на сегодня (для обзора): `/api/schedule/bookings?start_date=2025-12-15&end_date=2025-12-15`
    - Получить записи Коворкинг на сегодня: `/api/schedule/bookings?start_date=2025-12-15&end_date=2025-12-15&category=Коворкинг`
    - Получить записи Eywa Kids на сегодня: `/api/schedule/bookings?start_date=2025-12-15&end_date=2025-12-15&category=Eywa Kids`
    """
    repo = ScheduleBookingRepository(session)
    
    start_date_obj = date.fromisoformat(start_date) if start_date else None
    end_date_obj = date.fromisoformat(end_date) if end_date else None
    
    return await repo.list_bookings(
        start_date=start_date_obj,
        end_date=end_date_obj,
        category=category,
        trainer_id=trainer_id,
        status=booking_status,
    )


@router.get("/schedule/bookings/{booking_id}", response_model=ScheduleBooking)
async def get_booking(
    booking_id: str,
    session: AsyncSession = Depends(get_session),
) -> ScheduleBooking:
    """
    Получить запись по ID.
    """
    repo = ScheduleBookingRepository(session)
    booking = await repo.get_by_public_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.post(
    "/schedule/bookings",
    response_model=ScheduleBooking,
    status_code=status.HTTP_201_CREATED,
)
async def create_booking(
    payload: ScheduleBookingCreate,
    session: AsyncSession = Depends(get_session),
) -> ScheduleBooking:
    """
    Создать новую запись в расписании.
    
    **Категории:**
    - `"Body Mind"` - для групповых занятий (йога, пилатес и т.д.)
    - `"Pilates Reformer"` - для занятий на пилатес-реформере
    - `"Коворкинг"` - для коворкинг-мест
    - `"Eywa Kids"` - для детских занятий
    
    **Пример для Body Mind:**
    ```json
    {
      "booking_date": "2025-12-15",
      "booking_time": "10:00",
      "category": "Body Mind",
      "service_name": "Йога для начинающих",
      "trainer_id": "1cefeb98-9f2e-44fd-9566-8c1363212b4b",
      "trainer_name": "Анна С.",
      "clients": [
        {
          "client_id": "c1",
          "client_name": "Иван Петров",
          "client_phone": "+7 900 123-45-67"
        }
      ],
      "max_capacity": 10,
      "status": "Свободно"
    }
    ```
    
    **Пример для Pilates Reformer:**
    ```json
    {
      "booking_date": "2025-12-15",
      "booking_time": "14:00",
      "category": "Pilates Reformer",
      "trainer_id": "1cefeb98-9f2e-44fd-9566-8c1363212b4b",
      "trainer_name": "Анастасия П.",
      "max_capacity": 1,
      "status": "Свободно"
    }
    ```
    
    **Пример для Коворкинг:**
    ```json
    {
      "booking_date": "2025-12-15",
      "booking_time": "10:00",
      "category": "Коворкинг",
      "capsule_id": "capsule-1",
      "capsule_name": "Капсула 1",
      "clients": [
        {
          "client_id": "c1",
          "client_name": "Иван Петров",
          "client_phone": "+7 900 123-45-67"
        }
      ],
      "max_capacity": 1,
      "status": "Бронь",
      "notes": "Примечание для менеджеров"
    }
    ```
    
    **Пример для Eywa Kids:**
    ```json
    {
      "booking_date": "2025-12-15",
      "booking_time": "14:00",
      "category": "Eywa Kids",
      "clients": [
        {
          "client_id": "c1",
          "client_name": "Мария Сидорова",
          "client_phone": "+7 900 123-45-67"
        }
      ],
      "max_capacity": 1,
      "status": "Бронь",
      "notes": "Примечание для менеджеров"
    }
    ```
    """
    repo = ScheduleBookingRepository(session)
    return await repo.create_booking(payload)


@router.patch("/schedule/bookings/{booking_id}", response_model=ScheduleBooking)
async def update_booking(
    booking_id: str,
    payload: ScheduleBookingUpdate,
    session: AsyncSession = Depends(get_session),
) -> ScheduleBooking:
    """
    Обновить запись в расписании.
    """
    repo = ScheduleBookingRepository(session)
    booking = await repo.update_booking(booking_id, payload)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.delete("/schedule/bookings/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_booking(
    booking_id: str,
    session: AsyncSession = Depends(get_session),
):
    """
    Удалить запись из расписания.
    """
    repo = ScheduleBookingRepository(session)
    deleted = await repo.delete_booking(booking_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Booking not found")


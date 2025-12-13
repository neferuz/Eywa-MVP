from __future__ import annotations

from datetime import date, timedelta
from sqlalchemy import select, func, and_, cast, Date, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.client import Client as ClientModel
from app.models.payment import Payment as PaymentModel
from app.models.schedule_booking import ScheduleBooking as ScheduleBookingModel


class AIAssistantRepository:
    """Репозиторий для получения статистики CRM для AI ассистента."""
    
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_clients_count(self) -> int:
        """Получить общее количество клиентов."""
        stmt = select(func.count(ClientModel.id))
        result = await self.session.scalar(stmt)
        return int(result or 0)

    async def get_new_clients_count(self, period: str = "today") -> int:
        """Получить количество новых клиентов за период.
        
        Args:
            period: "today", "week", "month"
        """
        today = date.today()
        
        if period == "today":
            start_date = today
            end_date = today
        elif period == "week":
            days_since_monday = today.weekday()
            start_date = today - timedelta(days=days_since_monday)
            end_date = today
        elif period == "month":
            start_date = date(today.year, today.month, 1)
            if today.month == 12:
                end_date = date(today.year + 1, 1, 1) - timedelta(days=1)
            else:
                end_date = date(today.year, today.month + 1, 1) - timedelta(days=1)
        else:
            start_date = today
            end_date = today
        
        stmt = select(func.count(ClientModel.id)).where(
            and_(
                cast(ClientModel.created_at, Date) >= start_date,
                cast(ClientModel.created_at, Date) <= end_date
            )
        )
        result = await self.session.scalar(stmt)
        return int(result or 0)

    async def get_active_clients_count(self) -> int:
        """Получить количество активных клиентов."""
        stmt = select(func.count(ClientModel.id)).where(
            ClientModel.status == "Активный"
        )
        result = await self.session.scalar(stmt)
        return int(result or 0)

    async def get_today_bookings_count(self) -> int:
        """Получить количество записей на сегодня."""
        today = date.today()
        stmt = select(func.count(ScheduleBookingModel.id)).where(
            and_(
                ScheduleBookingModel.booking_date == today,
                ScheduleBookingModel.status.in_(["Бронь", "Оплачено"])
            )
        )
        result = await self.session.scalar(stmt)
        return int(result or 0)

    async def get_revenue(self, period: str = "today") -> float:
        """Получить выручку за период.
        
        Args:
            period: "today", "week", "month"
        """
        today = date.today()
        
        if period == "today":
            start_date = today
            end_date = today
        elif period == "week":
            days_since_monday = today.weekday()
            start_date = today - timedelta(days=days_since_monday)
            end_date = today
        elif period == "month":
            start_date = date(today.year, today.month, 1)
            if today.month == 12:
                end_date = date(today.year + 1, 1, 1) - timedelta(days=1)
            else:
                end_date = date(today.year, today.month + 1, 1) - timedelta(days=1)
        else:
            start_date = today
            end_date = today
        
        stmt = select(func.sum(PaymentModel.total_amount)).where(
            and_(
                cast(PaymentModel.created_at, Date) >= start_date,
                cast(PaymentModel.created_at, Date) <= end_date,
                PaymentModel.status == 'completed'
            )
        )
        result = await self.session.scalar(stmt)
        return float(result or 0)

    async def get_available_slots_today(self) -> int:
        """Получить количество свободных слотов на сегодня."""
        today = date.today()
        
        # Получаем все записи на сегодня
        stmt = select(
            func.sum(ScheduleBookingModel.max_capacity - ScheduleBookingModel.current_count)
        ).where(
            and_(
                ScheduleBookingModel.booking_date == today,
                ScheduleBookingModel.status == "Свободно"
            )
        )
        result = await self.session.scalar(stmt)
        return int(result or 0)

    async def get_crm_stats(self) -> dict:
        """Получить общую статистику CRM для AI ассистента."""
        return {
            "total_clients": await self.get_clients_count(),
            "active_clients": await self.get_active_clients_count(),
            "new_clients_today": await self.get_new_clients_count("today"),
            "new_clients_week": await self.get_new_clients_count("week"),
            "new_clients_month": await self.get_new_clients_count("month"),
            "today_bookings": await self.get_today_bookings_count(),
            "revenue_today": await self.get_revenue("today"),
            "revenue_week": await self.get_revenue("week"),
            "revenue_month": await self.get_revenue("month"),
            "available_slots_today": await self.get_available_slots_today(),
        }


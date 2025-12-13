from __future__ import annotations

from datetime import date, timedelta
from sqlalchemy import func, and_, case, distinct, cast, Float, String
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schedule_booking import ScheduleBooking as ScheduleBookingModel
from app.schemas.body_schedule import (
    BodyScheduleAnalytics,
    OverviewStats,
    GroupAnalytics,
    CoachLoad,
    RoomLoad,
)


class BodyScheduleRepository:
    """Репозиторий для аналитики расписания BODY."""

    def __init__(self, session: AsyncSession):
        self.session = session

    def _get_week_range(self, start_date: date | None = None) -> tuple[date, date]:
        """Получить диапазон текущей недели (понедельник - воскресенье)."""
        if start_date is None:
            start_date = date.today()
        
        # Находим понедельник текущей недели
        days_since_monday = start_date.weekday()
        monday = start_date - timedelta(days=days_since_monday)
        sunday = monday + timedelta(days=6)
        
        return monday, sunday

    async def get_analytics(
        self, start_date: date | None = None, end_date: date | None = None
    ) -> BodyScheduleAnalytics:
        """Получить полную аналитику по расписанию BODY."""
        # Если даты не указаны, используем текущую неделю
        if start_date is None or end_date is None:
            start_date, end_date = self._get_week_range(start_date)

        # Общая статистика
        overview = await self._get_overview_stats(start_date, end_date)
        
        # Аналитика по группам
        groups = await self._get_groups_analytics(start_date, end_date)
        
        # Загрузка тренеров
        coaches = await self._get_coaches_load(start_date, end_date)
        
        # Загрузка залов
        rooms = await self._get_rooms_load(start_date, end_date)

        return BodyScheduleAnalytics(
            overview=overview,
            groups=groups,
            coaches=coaches,
            rooms=rooms,
        )

    async def _get_overview_stats(
        self, start_date: date, end_date: date
    ) -> OverviewStats:
        """Получить общую статистику."""
        from sqlalchemy import select

        stmt = select(
            func.count(ScheduleBookingModel.id).label("total_slots"),
            func.count(
                case(
                    (
                        ScheduleBookingModel.status.in_(["Бронь", "Оплачено"]),
                        1,
                    ),
                    else_=None,
                )
            ).label("booked_slots"),
        ).where(
            and_(
                ScheduleBookingModel.booking_date >= start_date,
                ScheduleBookingModel.booking_date <= end_date,
                ScheduleBookingModel.category.in_(["Body Mind", "Pilates Reformer"]),
            )
        )

        result = await self.session.execute(stmt)
        row = result.first()

        total_slots = row.total_slots or 0
        booked_slots = row.booked_slots or 0
        load_percentage = (
            int((booked_slots / total_slots * 100)) if total_slots > 0 else 0
        )

        return OverviewStats(
            total_slots=total_slots,
            booked_slots=booked_slots,
            load_percentage=load_percentage,
        )

    async def _get_groups_analytics(
        self, start_date: date, end_date: date
    ) -> list[GroupAnalytics]:
        """Получить аналитику по группам (BODY и REFORM)."""
        from sqlalchemy import select

        # Маппинг категорий
        category_mapping = {
            "Body Mind": {
                "id": "body",
                "name": "BODY",
                "label": "BODY",
            },
            "Pilates Reformer": {
                "id": "reform",
                "name": "REFORM",
                "label": "REFORM",
            },
        }

        groups = []

        for category, meta in category_mapping.items():
            # Общее количество уникальных занятий (дата + время)
            classes_stmt = select(
                func.count(
                    distinct(
                        func.concat(
                            cast(ScheduleBookingModel.booking_date, String),
                            "-",
                            cast(ScheduleBookingModel.booking_time, String),
                        )
                    )
                )
            ).where(
                and_(
                    ScheduleBookingModel.booking_date >= start_date,
                    ScheduleBookingModel.booking_date <= end_date,
                    ScheduleBookingModel.category == category,
                )
            )

            classes_result = await self.session.execute(classes_stmt)
            total_classes = classes_result.scalar() or 0

            # Общее количество записей (сумма current_count)
            bookings_stmt = select(
                func.sum(ScheduleBookingModel.current_count)
            ).where(
                and_(
                    ScheduleBookingModel.booking_date >= start_date,
                    ScheduleBookingModel.booking_date <= end_date,
                    ScheduleBookingModel.category == category,
                )
            )

            bookings_result = await self.session.execute(bookings_stmt)
            total_bookings = int(bookings_result.scalar() or 0)

            # Загрузка (занятые слоты / всего слотов)
            load_stmt = select(
                func.count(ScheduleBookingModel.id).label("total"),
                func.count(
                    case(
                        (
                            ScheduleBookingModel.status.in_(["Бронь", "Оплачено"]),
                            1,
                        ),
                        else_=None,
                    )
                ).label("booked"),
            ).where(
                and_(
                    ScheduleBookingModel.booking_date >= start_date,
                    ScheduleBookingModel.booking_date <= end_date,
                    ScheduleBookingModel.category == category,
                )
            )

            load_result = await self.session.execute(load_stmt)
            load_row = load_result.first()
            total_slots = load_row.total or 0
            booked_slots = load_row.booked or 0
            load = int((booked_slots / total_slots * 100)) if total_slots > 0 else 0

            # Средняя заполненность
            occupancy_stmt = select(
                func.avg(
                    case(
                        (
                            ScheduleBookingModel.max_capacity > 0,
                            cast(ScheduleBookingModel.current_count, Float)
                            / cast(ScheduleBookingModel.max_capacity, Float)
                            * 100,
                        ),
                        else_=None,
                    )
                )
            ).where(
                and_(
                    ScheduleBookingModel.booking_date >= start_date,
                    ScheduleBookingModel.booking_date <= end_date,
                    ScheduleBookingModel.category == category,
                    ScheduleBookingModel.max_capacity > 0,
                )
            )

            occupancy_result = await self.session.execute(occupancy_stmt)
            avg_occupancy = int(occupancy_result.scalar() or 0)

            # Список тренеров
            coaches_stmt = select(
                distinct(ScheduleBookingModel.trainer_name)
            ).where(
                and_(
                    ScheduleBookingModel.booking_date >= start_date,
                    ScheduleBookingModel.booking_date <= end_date,
                    ScheduleBookingModel.category == category,
                    ScheduleBookingModel.trainer_name.isnot(None),
                )
            )

            coaches_result = await self.session.execute(coaches_stmt)
            coaches_list = [
                name for name in coaches_result.scalars().all() if name is not None
            ]

            groups.append(
                GroupAnalytics(
                    id=meta["id"],
                    name=meta["name"],
                    label=meta["label"],
                    total_classes=total_classes,
                    total_bookings=total_bookings,
                    load=load,
                    coaches=coaches_list,
                    avg_occupancy=avg_occupancy,
                )
            )

        return groups

    async def _get_coaches_load(
        self, start_date: date, end_date: date
    ) -> list[CoachLoad]:
        """Получить загрузку тренеров."""
        from sqlalchemy import select

        # Загрузка по тренерам
        stmt = (
            select(
                ScheduleBookingModel.trainer_name.label("name"),
                func.count(ScheduleBookingModel.id).label("total"),
                func.count(
                    case(
                        (
                            ScheduleBookingModel.status.in_(["Бронь", "Оплачено"]),
                            1,
                        ),
                        else_=None,
                    )
                ).label("booked"),
                func.count(
                    distinct(
                        func.concat(
                            cast(ScheduleBookingModel.booking_date, String),
                            "-",
                            cast(ScheduleBookingModel.booking_time, String),
                        )
                    )
                ).label("classes"),
            )
            .where(
                and_(
                    ScheduleBookingModel.booking_date >= start_date,
                    ScheduleBookingModel.booking_date <= end_date,
                    ScheduleBookingModel.category.in_(["Body Mind", "Pilates Reformer"]),
                    ScheduleBookingModel.trainer_name.isnot(None),
                )
            )
            .group_by(ScheduleBookingModel.trainer_name)
        )

        result = await self.session.execute(stmt)
        coaches = []

        for row in result.all():
            if row.name:
                total = row.total or 0
                booked = row.booked or 0
                load = int((booked / total * 100)) if total > 0 else 0
                classes = row.classes or 0

                coaches.append(
                    CoachLoad(
                        name=row.name,
                        load=load,
                        classes=classes,
                    )
                )

        # Сортируем по загрузке (убывание)
        coaches.sort(key=lambda x: x.load, reverse=True)

        return coaches

    async def _get_rooms_load(
        self, start_date: date, end_date: date
    ) -> list[RoomLoad]:
        """Получить загрузку залов."""
        from sqlalchemy import select

        # Загрузка по залам (capsule_name)
        stmt = (
            select(
                ScheduleBookingModel.capsule_name.label("room"),
                func.count(ScheduleBookingModel.id).label("total"),
                func.count(
                    case(
                        (
                            ScheduleBookingModel.status.in_(["Бронь", "Оплачено"]),
                            1,
                        ),
                        else_=None,
                    )
                ).label("booked"),
            )
            .where(
                and_(
                    ScheduleBookingModel.booking_date >= start_date,
                    ScheduleBookingModel.booking_date <= end_date,
                    ScheduleBookingModel.category.in_(["Body Mind", "Pilates Reformer"]),
                    ScheduleBookingModel.capsule_name.isnot(None),
                )
            )
            .group_by(ScheduleBookingModel.capsule_name)
        )

        result = await self.session.execute(stmt)
        rooms = []

        for row in result.all():
            if row.room:
                total = row.total or 0
                booked = row.booked or 0
                load = int((booked / total * 100)) if total > 0 else 0

                rooms.append(
                    RoomLoad(
                        room=row.room,
                        load=load,
                    )
                )

        # Сортируем по названию зала
        rooms.sort(key=lambda x: x.room)

        return rooms


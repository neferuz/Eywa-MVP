from __future__ import annotations

from datetime import date, timedelta
from sqlalchemy import select, func, and_, case, distinct, cast, String, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dashboard import DashboardLoad, DashboardHighlight
from app.models.payment import Payment as PaymentModel
from app.models.client import Client as ClientModel
from app.models.schedule_booking import ScheduleBooking as ScheduleBookingModel
from app.schemas.dashboard import DashboardSummary, KpiCard, LoadSnapshotItem, AiHighlight, Trend
from app.schemas.booking import TodayBooking
from app.repositories.body_schedule import BodyScheduleRepository


class DashboardRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def fetch_summary(self) -> DashboardSummary | None:
        # Рассчитываем реальные KPI
        kpis = await self._calculate_kpis()
        
        # Рассчитываем реальную загрузку по направлениям
        loads = await self._calculate_load()
        
        # Highlights из таблиц
        highlight_rows = await self.session.scalars(
            select(DashboardHighlight).order_by(DashboardHighlight.sort_order, DashboardHighlight.id)
        )

        highlights = [self._map_highlight(row) for row in highlight_rows]

        # Если нет KPI, возвращаем None (будет использован fallback)
        if not kpis:
            return None

        # Если нет loads или highlights, используем пустые списки
        if not loads:
            loads = []
        if not highlights:
            highlights = []

        return DashboardSummary(kpi=kpis, load=loads, highlights=highlights)

    async def _calculate_kpis(self) -> list[KpiCard]:
        """Рассчитать реальные KPI из данных."""
        kpis = []
        
        # 1. Выручка
        revenue_kpi = await self._calculate_revenue()
        if revenue_kpi:
            kpis.append(revenue_kpi)
        
        # 2. Проданные абонементы
        subscriptions_kpi = await self._calculate_subscriptions()
        if subscriptions_kpi:
            kpis.append(subscriptions_kpi)
        
        # 3. Новые клиенты
        clients_kpi = await self._calculate_new_clients()
        if clients_kpi:
            kpis.append(clients_kpi)
        
        # 4. Записи на сегодня (пока оставляем как есть, потом сделаем)
        # Можно добавить позже
        
        return kpis

    async def _calculate_revenue(self) -> KpiCard | None:
        """Рассчитать выручку за текущий месяц и сравнить с прошлым."""
        from sqlalchemy import cast, Date
        
        today = date.today()
        # Начало текущего месяца
        current_month_start = date(today.year, today.month, 1)
        # Конец текущего месяца
        if today.month == 12:
            current_month_end = date(today.year + 1, 1, 1) - timedelta(days=1)
        else:
            current_month_end = date(today.year, today.month + 1, 1) - timedelta(days=1)
        
        # Начало прошлого месяца
        if today.month == 1:
            previous_month_start = date(today.year - 1, 12, 1)
            previous_month_end = date(today.year, 1, 1) - timedelta(days=1)
        else:
            previous_month_start = date(today.year, today.month - 1, 1)
            previous_month_end = date(today.year, today.month, 1) - timedelta(days=1)
        
        # Текущий месяц
        current_stmt = select(func.sum(PaymentModel.total_amount)).where(
            and_(
                cast(PaymentModel.created_at, Date) >= current_month_start,
                cast(PaymentModel.created_at, Date) <= current_month_end,
                PaymentModel.status == 'completed'
            )
        )
        current_result = await self.session.scalar(current_stmt)
        current_revenue = int(current_result or 0)
        
        # Прошлый месяц
        previous_stmt = select(func.sum(PaymentModel.total_amount)).where(
            and_(
                cast(PaymentModel.created_at, Date) >= previous_month_start,
                cast(PaymentModel.created_at, Date) <= previous_month_end,
                PaymentModel.status == 'completed'
            )
        )
        previous_result = await self.session.scalar(previous_stmt)
        previous_revenue = int(previous_result or 0)
        
        # Расчет изменения
        if previous_revenue > 0:
            change_percent = ((current_revenue - previous_revenue) / previous_revenue) * 100
            change_str = f"{'+' if change_percent >= 0 else ''}{change_percent:.1f}%"
            trend = Trend.UP if change_percent >= 0 else Trend.DOWN
        else:
            change_str = "0%"
            trend = Trend.UP if current_revenue > 0 else Trend.DOWN
        
        # Форматирование суммы с пробелами
        revenue_str = f"{current_revenue:,}".replace(",", " ")
        
        return KpiCard(
            label="Выручка",
            value=revenue_str,
            unit="сум",
            change=change_str,
            trend=trend,
            icon="DollarSign",
            color="#10B981",
        )

    async def _calculate_subscriptions(self) -> KpiCard | None:
        """Рассчитать количество проданных абонементов за текущий месяц."""
        from sqlalchemy import cast, Date, or_
        
        today = date.today()
        # Начало текущего месяца
        current_month_start = date(today.year, today.month, 1)
        # Конец текущего месяца
        if today.month == 12:
            current_month_end = date(today.year + 1, 1, 1) - timedelta(days=1)
        else:
            current_month_end = date(today.year, today.month + 1, 1) - timedelta(days=1)
        
        # Начало прошлого месяца
        if today.month == 1:
            previous_month_start = date(today.year - 1, 12, 1)
            previous_month_end = date(today.year, 1, 1) - timedelta(days=1)
        else:
            previous_month_start = date(today.year, today.month - 1, 1)
            previous_month_end = date(today.year, today.month, 1) - timedelta(days=1)
        
        # Текущий месяц - считаем количество уникальных абонементов
        # Группируем по client_id + service_name (как на странице subscriptions)
        # Фильтруем только Body абонементы (категория Body или название содержит body)
        # Исключаем разовые (quantity = 1 и нет слова "абонемент")
        
        # Используем подзапрос с GROUP BY для правильной группировки
        # Создаем подзапрос для группировки
        subquery_current = select(
            func.coalesce(PaymentModel.client_id, PaymentModel.client_name).label('client_key'),
            PaymentModel.service_name.label('service_name')
        ).where(
            and_(
                cast(PaymentModel.created_at, Date) >= current_month_start,
                cast(PaymentModel.created_at, Date) <= current_month_end,
                PaymentModel.status == 'completed',
                PaymentModel.quantity > 0,
                or_(
                    PaymentModel.service_category.ilike('%body%'),
                    PaymentModel.service_name.ilike('%body%')
                ),
                # Исключаем разовые: quantity > 1 или название содержит "абонемент"
                or_(
                    PaymentModel.quantity > 1,
                    PaymentModel.service_name.ilike('%абонемент%')
                )
            )
        ).group_by(
            func.coalesce(PaymentModel.client_id, PaymentModel.client_name),
            PaymentModel.service_name
        ).subquery()
        
        current_stmt = select(func.count()).select_from(subquery_current)
        current_result = await self.session.scalar(current_stmt)
        current_subscriptions = int(current_result or 0)
        
        # Прошлый месяц
        subquery_previous = select(
            func.coalesce(PaymentModel.client_id, PaymentModel.client_name).label('client_key'),
            PaymentModel.service_name.label('service_name')
        ).where(
            and_(
                cast(PaymentModel.created_at, Date) >= previous_month_start,
                cast(PaymentModel.created_at, Date) <= previous_month_end,
                PaymentModel.status == 'completed',
                PaymentModel.quantity > 0,
                or_(
                    PaymentModel.service_category.ilike('%body%'),
                    PaymentModel.service_name.ilike('%body%')
                ),
                or_(
                    PaymentModel.quantity > 1,
                    PaymentModel.service_name.ilike('%абонемент%')
                )
            )
        ).group_by(
            func.coalesce(PaymentModel.client_id, PaymentModel.client_name),
            PaymentModel.service_name
        ).subquery()
        
        previous_stmt = select(func.count()).select_from(subquery_previous)
        previous_result = await self.session.scalar(previous_stmt)
        previous_subscriptions = int(previous_result or 0)
        
        # Расчет изменения
        if previous_subscriptions > 0:
            change_percent = ((current_subscriptions - previous_subscriptions) / previous_subscriptions) * 100
            change_str = f"{'+' if change_percent >= 0 else ''}{change_percent:.1f}%"
            trend = Trend.UP if change_percent >= 0 else Trend.DOWN
        else:
            change_str = "0%"
            trend = Trend.UP if current_subscriptions > 0 else Trend.DOWN
        
        return KpiCard(
            label="Проданных абонементов",
            value=str(current_subscriptions),
            unit="",
            change=change_str,
            trend=trend,
            icon="CreditCard",
            color="#8B5CF6",
        )

    async def _calculate_new_clients(self) -> KpiCard | None:
        """Рассчитать количество новых клиентов за текущий месяц."""
        from sqlalchemy import cast, Date
        
        today = date.today()
        # Начало текущего месяца
        current_month_start = date(today.year, today.month, 1)
        # Конец текущего месяца
        if today.month == 12:
            current_month_end = date(today.year + 1, 1, 1) - timedelta(days=1)
        else:
            current_month_end = date(today.year, today.month + 1, 1) - timedelta(days=1)
        
        # Начало прошлого месяца
        if today.month == 1:
            previous_month_start = date(today.year - 1, 12, 1)
            previous_month_end = date(today.year, 1, 1) - timedelta(days=1)
        else:
            previous_month_start = date(today.year, today.month - 1, 1)
            previous_month_end = date(today.year, today.month, 1) - timedelta(days=1)
        
        # Текущий месяц
        current_stmt = select(func.count(ClientModel.id)).where(
            and_(
                cast(ClientModel.created_at, Date) >= current_month_start,
                cast(ClientModel.created_at, Date) <= current_month_end
            )
        )
        current_result = await self.session.scalar(current_stmt)
        current_clients = int(current_result or 0)
        
        # Прошлый месяц
        previous_stmt = select(func.count(ClientModel.id)).where(
            and_(
                cast(ClientModel.created_at, Date) >= previous_month_start,
                cast(ClientModel.created_at, Date) <= previous_month_end
            )
        )
        previous_result = await self.session.scalar(previous_stmt)
        previous_clients = int(previous_result or 0)
        
        # Расчет изменения
        if previous_clients > 0:
            change_percent = ((current_clients - previous_clients) / previous_clients) * 100
            change_str = f"{'+' if change_percent >= 0 else ''}{change_percent:.1f}%"
            trend = Trend.UP if change_percent >= 0 else Trend.DOWN
        else:
            change_str = "0%"
            trend = Trend.UP if current_clients > 0 else Trend.DOWN
        
        return KpiCard(
            label="Кол-во новых клиентов",
            value=str(current_clients),
            unit="",
            change=change_str,
            trend=trend,
            icon="Users",
            color="#6366F1",
        )

    async def _calculate_load(self) -> list[LoadSnapshotItem]:
        """Рассчитать загрузку по направлениям: коворкинг, детская, Body Mind, Pilates Reformer."""
        loads = []
        
        # Получаем текущую неделю
        today = date.today()
        days_since_monday = today.weekday()
        monday = today - timedelta(days=days_since_monday)
        sunday = monday + timedelta(days=6)
        
        # 1. Коворкинг капсулы
        coworking_load = await self._calculate_coworking_load(monday, sunday)
        if coworking_load:
            loads.append(coworking_load)
        
        # 2. Детская
        kids_load = await self._calculate_kids_load(monday, sunday)
        if kids_load:
            loads.append(kids_load)
        
        # 3. Body Mind и Pilates Reformer (используем BodyScheduleRepository)
        body_loads = await self._calculate_body_loads(monday, sunday)
        loads.extend(body_loads)
        
        return loads

    async def _calculate_coworking_load(self, start_date: date, end_date: date) -> LoadSnapshotItem | None:
        """Рассчитать загрузку коворкинга (капсулы)."""
        # Считаем все записи с категорией "Коворкинг" или где есть capsule_id
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
            func.sum(ScheduleBookingModel.max_capacity).label("total_capacity"),
            func.sum(ScheduleBookingModel.current_count).label("total_booked"),
        ).where(
            and_(
                ScheduleBookingModel.booking_date >= start_date,
                ScheduleBookingModel.booking_date <= end_date,
                or_(
                    ScheduleBookingModel.category.ilike('%коворкинг%'),
                    ScheduleBookingModel.category.ilike('%coworking%'),
                    ScheduleBookingModel.capsule_id.isnot(None),
                ),
            )
        )
        
        result = await self.session.execute(stmt)
        row = result.first()
        
        total_slots = row.total_slots or 0
        booked_slots = row.booked_slots or 0
        total_capacity = row.total_capacity or 0
        total_booked = row.total_booked or 0
        
        # Загрузка в процентах
        if total_capacity > 0:
            load_percentage = int((total_booked / total_capacity) * 100)
        elif total_slots > 0:
            load_percentage = int((booked_slots / total_slots) * 100)
        else:
            load_percentage = 0
        
        # Детали: количество занятых мест из всех капсул
        detail = f"{int(total_booked)}/{int(total_capacity)} мест" if total_capacity > 0 else "Капсулы"
        
        return LoadSnapshotItem(
            label="Коворкинг",
            value=load_percentage,
            detail=detail,
            color="#10B981",
        )

    async def _calculate_kids_load(self, start_date: date, end_date: date) -> LoadSnapshotItem | None:
        """Рассчитать загрузку детской."""
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
            func.sum(ScheduleBookingModel.max_capacity).label("total_capacity"),
            func.sum(ScheduleBookingModel.current_count).label("total_booked"),
        ).where(
            and_(
                ScheduleBookingModel.booking_date >= start_date,
                ScheduleBookingModel.booking_date <= end_date,
                or_(
                    ScheduleBookingModel.category.ilike('%kids%'),
                    ScheduleBookingModel.category.ilike('%детск%'),
                    ScheduleBookingModel.category.ilike('%eywa kids%'),
                ),
            )
        )
        
        result = await self.session.execute(stmt)
        row = result.first()
        
        total_slots = row.total_slots or 0
        booked_slots = row.booked_slots or 0
        total_capacity = row.total_capacity or 0
        total_booked = row.total_booked or 0
        
        # Загрузка в процентах
        if total_capacity > 0:
            load_percentage = int((total_booked / total_capacity) * 100)
        elif total_slots > 0:
            load_percentage = int((booked_slots / total_slots) * 100)
        else:
            load_percentage = 0
        
        detail = "Группы 6-10 лет"
        
        return LoadSnapshotItem(
            label="Детская",
            value=load_percentage,
            detail=detail,
            color="#EF4444",
        )

    async def _calculate_body_loads(self, start_date: date, end_date: date) -> list[LoadSnapshotItem]:
        """Рассчитать загрузку Body Mind и Pilates Reformer."""
        loads = []
        
        # Используем BodyScheduleRepository для получения данных
        body_repo = BodyScheduleRepository(self.session)
        analytics = await body_repo.get_analytics(start_date, end_date)
        
        # Body Mind
        body_group = next((g for g in analytics.groups if g.id == "body"), None)
        if body_group:
            loads.append(LoadSnapshotItem(
                label="Body Mind",
                value=body_group.load,
                detail=f"{body_group.total_classes} занятий · {body_group.total_bookings} записей",
                color="#6366F1",
            ))
        
        # Pilates Reformer
        reform_group = next((g for g in analytics.groups if g.id == "reform"), None)
        if reform_group:
            loads.append(LoadSnapshotItem(
                label="Pilates Reformer",
                value=reform_group.load,
                detail=f"{reform_group.total_classes} занятий · {reform_group.total_bookings} записей",
                color="#C86B58",
            ))
        
        return loads

    async def fetch_today_bookings(self) -> list[TodayBooking] | None:
        return None

    @staticmethod
    def _map_load(row: DashboardLoad) -> LoadSnapshotItem:
        return LoadSnapshotItem(
            label=row.label,
            value=row.value,
            detail=row.detail,
            color=row.color,
        )

    @staticmethod
    def _map_highlight(row: DashboardHighlight) -> AiHighlight:
        return AiHighlight(
            title=row.title,
            detail=row.detail,
            tone=row.tone,
        )


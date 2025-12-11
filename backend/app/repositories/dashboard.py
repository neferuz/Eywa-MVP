from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dashboard import DashboardKPI, DashboardLoad, DashboardHighlight
from app.schemas.dashboard import DashboardSummary, KpiCard, LoadSnapshotItem, AiHighlight, Trend
from app.schemas.booking import TodayBooking


class DashboardRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def fetch_summary(self) -> DashboardSummary | None:
        kpi_rows = await self.session.scalars(
            select(DashboardKPI).order_by(DashboardKPI.sort_order, DashboardKPI.id)
        )
        load_rows = await self.session.scalars(
            select(DashboardLoad).order_by(DashboardLoad.sort_order, DashboardLoad.id)
        )
        highlight_rows = await self.session.scalars(
            select(DashboardHighlight).order_by(DashboardHighlight.sort_order, DashboardHighlight.id)
        )

        kpis = [self._map_kpi(row) for row in kpi_rows]
        loads = [self._map_load(row) for row in load_rows]
        highlights = [self._map_highlight(row) for row in highlight_rows]

        if not (kpis and loads and highlights):
            return None

        return DashboardSummary(kpi=kpis, load=loads, highlights=highlights)

    async def fetch_today_bookings(self) -> list[TodayBooking] | None:
        return None

    @staticmethod
    def _map_kpi(row: DashboardKPI) -> KpiCard:
        return KpiCard(
            label=row.label,
            value=row.value,
            unit=row.unit,
            change=row.change,
            trend=Trend(row.trend),
            icon=row.icon,
            color=row.color,
        )

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


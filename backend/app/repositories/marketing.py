from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Iterable

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.application import Application as ApplicationModel
from app.schemas.marketing import (
    MarketingTrafficResponse,
    MarketingConversionsResponse,
    MarketingConversionRow,
    TrafficChannel,
    TrafficSummary,
    TrafficTrendPoint,
)


PLATFORM_META = {
    "instagram": {"name": "Instagram", "accent": "#F97316"},
    "telegram": {"name": "Telegram", "accent": "#60A5FA"},
}


class MarketingRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def fetch_traffic(self, days: int = 14) -> MarketingTrafficResponse:
        """Aggregate marketing traffic based on Applications table."""
        stmt = select(ApplicationModel)
        result = await self.session.scalars(stmt)
        applications = result.all()

        channels: dict[str, dict[str, int]] = defaultdict(
            lambda: {"leads": 0, "inquiry": 0, "trial": 0, "sale": 0}
        )

        for app in applications:
            channel = channels[app.platform]
            channel["leads"] += 1
            channel[app.stage] += 1

        channel_models = [
            TrafficChannel(
                id=platform,
                name=PLATFORM_META.get(platform, {}).get("name", platform.title()),
                accent=PLATFORM_META.get(platform, {}).get("accent", "#6366F1"),
                leads=data["leads"],
                inquiry=data["inquiry"],
                trial=data["trial"],
                sale=data["sale"],
                conversion=self._calculate_conversion(data["sale"], data["leads"]),
            )
            for platform, data in channels.items()
        ]

        summary = TrafficSummary(
            total_leads=sum(ch.leads for ch in channel_models),
            total_sales=sum(ch.sale for ch in channel_models),
            total_trials=sum(ch.trial for ch in channel_models),
            conversion=self._calculate_conversion(
                sum(ch.sale for ch in channel_models),
                sum(ch.leads for ch in channel_models),
            ),
        )

        trend = self._build_trend(applications, days=days)

        return MarketingTrafficResponse(
            summary=summary,
            channels=sorted(
                channel_models,
                key=lambda ch: ch.leads,
                reverse=True,
            ),
            trend=trend,
        )

    async def fetch_conversions(self) -> MarketingConversionsResponse:
        """Build conversion funnel per platform from applications."""
        stmt = select(ApplicationModel)
        result = await self.session.scalars(stmt)
        applications = result.all()

        rows: dict[str, dict[str, int]] = defaultdict(
            lambda: {"leads": 0, "bookings": 0, "visits": 0, "sales": 0}
        )

        for app in applications:
            bucket = rows[app.platform]
            bucket["leads"] += 1
            # Используем существующие стадии: inquiry -> leads, trial -> bookings/visits, sale -> sales
            if app.stage == "trial":
                bucket["bookings"] += 1
                bucket["visits"] += 1
            if app.stage == "sale":
                bucket["sales"] += 1

        rows_models = [
            MarketingConversionRow(
                id=platform,
                channel=PLATFORM_META.get(platform, {}).get("name", platform.title()),
                accent=PLATFORM_META.get(platform, {}).get("accent", "#6366F1"),
                leads=data["leads"],
                bookings=data["bookings"],
                visits=data["visits"],
                sales=data["sales"],
                conversion=self._calculate_conversion(data["sales"], data["leads"]),
            )
            for platform, data in rows.items()
        ]

        return MarketingConversionsResponse(
            rows=sorted(rows_models, key=lambda r: r.leads, reverse=True)
        )

    @staticmethod
    def _calculate_conversion(sales: int, leads: int) -> float:
        if leads == 0:
            return 0.0
        return round(sales / leads, 4)

    def _build_trend(
        self,
        applications: Iterable[ApplicationModel],
        days: int = 14,
    ) -> list[TrafficTrendPoint]:
        cutoff = datetime.now(tz=timezone.utc) - timedelta(days=days - 1)
        buckets: dict[datetime.date, int] = defaultdict(int)

        for app in applications:
            created_at = app.created_at
            if created_at is None:
                continue
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            if created_at < cutoff:
                continue
            buckets[created_at.date()] += 1

        # Ensure missing dates appear with zero
        trend: list[TrafficTrendPoint] = []
        for i in range(days):
            day = (cutoff + timedelta(days=i)).date()
            trend.append(TrafficTrendPoint(date=day, leads=buckets.get(day, 0)))
        return trend



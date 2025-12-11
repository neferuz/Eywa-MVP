"""
Seed dashboard tables with demo data.

Usage:
    python -m scripts.seed_dashboard
"""

import asyncio

from sqlalchemy import delete

from app.db.session import SessionLocal
from app.models.dashboard import DashboardKPI, DashboardLoad, DashboardHighlight


async def seed() -> None:
    async with SessionLocal() as session:
        await session.execute(delete(DashboardKPI))
        await session.execute(delete(DashboardLoad))
        await session.execute(delete(DashboardHighlight))

        session.add_all(
            [
                DashboardKPI(
                    label="Выручка",
                    value="0",
                    unit="₽",
                    change="0%",
                    trend="up",
                    icon="DollarSign",
                    color="#10B981",
                    sort_order=1,
                ),
                DashboardKPI(
                    label="Расходы",
                    value="0",
                    unit="₽",
                    change="0%",
                    trend="down",
                    icon="Wallet",
                    color="#EF4444",
                    sort_order=2,
                ),
                DashboardKPI(
                    label="Кол-во новых клиентов",
                    value="0",
                    change="0%",
                    trend="up",
                    icon="Users",
                    color="#6366F1",
                    sort_order=3,
                ),
                DashboardKPI(
                    label="Кол-во записей на сегодня",
                    value="0",
                    change="0%",
                    trend="down",
                    icon="Calendar",
                    color="#F59E0B",
                    sort_order=4,
                ),
            ]
        )

        session.add_all(
            [
                DashboardLoad(label="BODY", value=0, detail="Нет данных", color="#6366F1", sort_order=1),
                DashboardLoad(label="COWORKING", value=0, detail="Нет данных", color="#10B981", sort_order=2),
                DashboardLoad(label="COFFEE", value=0, detail="Нет данных", color="#F59E0B", sort_order=3),
                DashboardLoad(label="KIDS", value=0, detail="Нет данных", color="#EF4444", sort_order=4),
            ]
        )

        session.add_all(
            [
                DashboardHighlight(
                    title="Недостаточно данных",
                    detail="Как только появятся транзакции, панель обновится автоматически.",
                    tone="neutral",
                    sort_order=1,
                )
            ]
        )

        await session.commit()


if __name__ == "__main__":
    asyncio.run(seed())


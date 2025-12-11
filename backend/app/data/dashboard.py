from app.schemas.dashboard import DashboardSummary, KpiCard, LoadSnapshotItem, AiHighlight, Trend

SUMMARY = DashboardSummary(
    kpi=[
        KpiCard(label="Выручка", value="2 450 000", unit="₽", change="+12.5%", trend=Trend.UP, icon="DollarSign", color="#10B981"),
        KpiCard(label="Расходы", value="1 120 000", unit="₽", change="+4.2%", trend=Trend.DOWN, icon="Wallet", color="#EF4444"),
        KpiCard(label="Кол-во новых клиентов", value="128", unit="", change="+9.1%", trend=Trend.UP, icon="Users", color="#6366F1"),
        KpiCard(label="Кол-во записей на сегодня", value="57", unit="", change="-2.7%", trend=Trend.DOWN, icon="Calendar", color="#F59E0B"),
    ],
    load=[
        LoadSnapshotItem(label="BODY", value=78, detail="3 зала · 15 тренеров", color="#6366F1"),
        LoadSnapshotItem(label="COWORKING", value=71, detail="21/30 мест", color="#10B981"),
        LoadSnapshotItem(label="COFFEE", value=64, detail="Avg чек 480 ₽", color="#F59E0B"),
        LoadSnapshotItem(label="KIDS", value=58, detail="Группы 6-10 лет", color="#EF4444"),
    ],
    highlights=[
        AiHighlight(title="Body: удержание +6%", detail="Абонементы 12 занятий растут быстрее остальных.", tone="positive"),
        AiHighlight(title="Coffee: чек ↓3.2%", detail="Провал по десертам в вечернее время.", tone="warning"),
        AiHighlight(title="Coworking: 2 отказа", detail="Не хватает тишины в open-space, проверьте зону meeting rooms.", tone="neutral"),
    ],
)


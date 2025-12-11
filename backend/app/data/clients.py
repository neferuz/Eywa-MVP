from app.schemas.client import Client, Subscription, ClientDirection, ClientStatus


CLIENTS: list[Client] = [
    Client(
        id="c1",
        name="Иван Петров",
        phone="+7 900 123-45-67",
        contract_number="D-2024-001",
        subscription_number="S-10001",
        birth_date="1992-03-14",
        instagram="@ivan.fit",
        source="Instagram",
        direction=ClientDirection.BODY,
        status=ClientStatus.ACTIVE,
        subscriptions=[Subscription(name="Body 12 занятий", valid_till="2026-01-15")],
        visits=["2025-11-02", "2025-11-05"],
        activation_date="2025-11-02",
        contraindications="Нет",
        coach_notes="Фокус на спине, избегать осевых нагрузок",
    ),
    Client(
        id="c2",
        name="Мария Смирнова",
        phone="+7 901 222-33-44",
        contract_number="D-2024-002",
        subscription_number="S-10002",
        birth_date="1990-07-02",
        instagram="@masha.space",
        source="Рекомендации",
        direction=ClientDirection.COWORKING,
        status=ClientStatus.NEW,
        subscriptions=[],
        visits=["2025-11-01"],
        activation_date="2025-11-01",
        contraindications="Аллергия на латекс",
        coach_notes="—",
    ),
    Client(
        id="c3",
        name="Олег Соколов",
        phone="+7 999 111-22-33",
        contract_number="D-2024-003",
        subscription_number="S-10003",
        birth_date="1988-12-22",
        instagram="@oleg.coffee",
        source="Google",
        direction=ClientDirection.COFFEE,
        status=ClientStatus.CHURNED,
        subscriptions=[Subscription(name="Coffee клуб", valid_till="2025-08-01")],
        visits=["2025-06-10", "2025-07-02"],
        activation_date="2025-06-10",
        contraindications="—",
        coach_notes="—",
    ),
]


def get_mock_client(client_id: str) -> Client | None:
    return next((client for client in CLIENTS if client.id == client_id), None)


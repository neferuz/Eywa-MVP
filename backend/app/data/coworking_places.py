from __future__ import annotations

from app.schemas.coworking_place import CoworkingPlace

# Temporary mock dataset while DB is empty or not migrated
MOCK_PLACES: list[CoworkingPlace] = [
    CoworkingPlace(
        id="cw-capsule-1",
        name="КАПСУЛА № 1",
        description=(
            "Капсула на 2-4 персоны. Полная тишина и приватность, "
            "телевизор/монитор для презентаций и трансляций, подключение ноутбука, штатив."
        ),
        type="capsule",
        seats=4,
        price_1h=100_000,
        price_3h=250_000,
        price_day=750_000,
        price_month=15_000_000,
    ),
    CoworkingPlace(
        id="cw-capsule-2",
        name="КАПСУЛА № 2",
        description=(
            "Капсула на 4-6 персон. Полная тишина и приватность, "
            "монитор для презентаций, штатив, подходит для командной работы."
        ),
        type="capsule",
        seats=6,
        price_1h=120_000,
        price_3h=300_000,
        price_day=900_000,
        price_month=18_000_000,
    ),
    CoworkingPlace(
        id="cw-capsule-3",
        name="КАПСУЛА № 3",
        description=(
            "Спокойная, изолированная капсула для продуктивной работы. "
            "Тишина, приватность, розетка для техники."
        ),
        type="capsule",
        seats=1,
        price_1h=50_000,
        price_3h=120_000,
        price_day=400_000,
        price_month=9_600_000,
    ),
    CoworkingPlace(
        id="cw-capsule-4",
        name="КАПСУЛА № 4",
        description=(
            "Спокойная, изолированная капсула для продуктивной работы. "
            "Тишина, приватность, розетка для техники."
        ),
        type="capsule",
        seats=1,
        price_1h=50_000,
        price_3h=120_000,
        price_day=400_000,
        price_month=9_600_000,
    ),
    CoworkingPlace(
        id="cw-capsule-5",
        name="КАПСУЛА № 5",
        description=(
            "Спокойная, изолированная капсула для продуктивной работы. "
            "Тишина, приватность, розетка для техники."
        ),
        type="capsule",
        seats=1,
        price_1h=50_000,
        price_3h=120_000,
        price_day=400_000,
        price_month=9_600_000,
    ),
    CoworkingPlace(
        id="cw-event",
        name="EVENT ZONE",
        description=(
            "Уютное пространство для мероприятий на 10-20 человек. "
            "Подходит для тренингов, семинаров, мастер-классов и презентаций."
        ),
        type="event",
        seats=20,
        price_1h=350_000,
        price_3h=900_000,
        price_day=2_000_000,
        price_month=None,
    ),
]


def get_mock_place(public_id: str) -> CoworkingPlace | None:
    return next((place for place in MOCK_PLACES if place.id == public_id), None)


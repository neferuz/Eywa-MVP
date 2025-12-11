from __future__ import annotations

from app.schemas.service import Service

MOCK_SERVICES: list[Service] = [
    Service(
        id="svc-yoga-basic",
        name="Йога базовая",
        category="Yoga",
        direction="Body",
        duration_minutes=60,
        price=180_000,
        description="Базовый уровень для новичков, мягкая практика дыхания и растяжки",
    ),
    Service(
        id="svc-yoga-adv",
        name="Йога продвинутая",
        category="Yoga",
        direction="Body",
        duration_minutes=90,
        price=230_000,
        description="Углубленная практика для продолжающих, больше баланса и силовых элементов",
    ),
    Service(
        id="svc-pilates-mat",
        name="Пилатес мат",
        category="Pilates",
        direction="Body",
        duration_minutes=60,
        price=210_000,
        description="Классический пилатес на коврике для укрепления кора",
    ),
    Service(
        id="svc-reformer-base",
        name="Reformer базовый",
        category="Reformer",
        direction="Body",
        duration_minutes=60,
        price=250_000,
        description="Работа на реформере: мобильность и контроль движений",
    ),
]


def get_mock_service(public_id: str) -> Service | None:
    return next((svc for svc in MOCK_SERVICES if svc.id == public_id), None)


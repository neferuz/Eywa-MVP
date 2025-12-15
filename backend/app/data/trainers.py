from __future__ import annotations

from app.schemas.trainer import Trainer

MOCK_TRAINERS: list[Trainer] = [
    Trainer(
        id="t1",
        full_name="Анна Лебедева",
        phone="+998 90 123 45 67",
        directions=["Body & Mind", "Reformer", "Stretching"],
        schedule="Пн-Пт · утро/вечер",
        comment="Фокус на технику и безопасное движение. Хорошо с клиентами с травмами спины.",
    ),
    Trainer(
        id="t2",
        full_name="Роман Ковалёв",
        phone="+998 90 555 55 55",
        directions=["Functional", "HIIT", "Mobility"],
        schedule="Будни · день",
        comment="Помогает новичкам и возвращающимся после пауз.",
    ),
]


def get_mock_trainer(public_id: str) -> Trainer | None:
    return next((t for t in MOCK_TRAINERS if t.id == public_id), None)











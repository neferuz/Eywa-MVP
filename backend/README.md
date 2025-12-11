# Eywa Backend

FastAPI service that powers the data API for Eywa CRM. The current iteration focuses on
laying a clean project foundation plus the first real endpoint (`GET /api/clients`) that
feeds the frontend CRM screens.

## Project structure

```
backend/
├── app/
│   ├── api/
│   │   └── routes/        # FastAPI routers (health, clients, …)
│   ├── core/              # Settings, configuration helpers
│   ├── data/              # Temporary mock data sources
│   ├── schemas/           # Pydantic models shared with the API
│   └── main.py            # App factory / FastAPI instance
└── requirements.txt
```

## Quick start

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# скопируйте env и пропишите доступ к Postgres
cp .env.example .env
# DATABASE_URL=postgresql+psycopg://user:pass@host:5432/eywa

uvicorn app.main:app --reload
```

> Требуется PostgreSQL 14+ (или совместимый). Пока миграции не настроены, таблицы
> можно создать вручную через Alembic позже.

### Available endpoints

| Method | Path          | Description                      |
| ------ | ------------- | -------------------------------- |
| GET    | `/health`     | Basic liveness probe             |
| GET    | `/api/info`   | Service metadata                 |
| GET    | `/api/clients`| Clients list + filters (mock DB) |
| GET    | `/api/clients/{id}`| Client detail by public id  |
| GET    | `/api/dashboard/summary` | KPI/load/highlights (Postgres → fallback mock) |

> NOTE: Клиентские данные берутся из Postgres (см. миграции) и при пустых таблицах
> API возвращает временный мок, чтобы фронт не падал.

## Next steps

- Add auth module (JWT) and protect sensitive routes.
- Expand routers for finance, schedules, marketing, telemetry, etc.

### Заполнение данных для дашборда

```bash
cd backend
alembic upgrade head
python -m scripts.seed_dashboard
```

Скрипт наполнит таблицы `dashboard_kpi`, `dashboard_load`, `dashboard_highlights`. После
этого фронт на `/` будет получать цифры из базы.

## Backup / Restore БД

Только код и миграции хранятся в Git. Чтобы не потерять данные, делайте дамп перед деплоем.

### Бэкап
```bash
cd backend
# DATABASE_URL должен быть задан (пример: postgresql://user:pass@host:5432/db)
./scripts/backup_db.sh backup.dump
```

### Восстановление
```bash
cd backend
# DATABASE_URL должен быть задан
./scripts/restore_db.sh backup.dump
```

### Обновление схемы после восстановления
```bash
cd backend
alembic upgrade head
```


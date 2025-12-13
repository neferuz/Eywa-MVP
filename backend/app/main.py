from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import api_router
from app.core.config import get_settings


def create_app() -> FastAPI:
    """Application factory to ease testing."""
    settings = get_settings()
    application = FastAPI(
        title="Eywa Backend",
        description="FastAPI service powering Eywa CRM",
        version="0.1.0",
    )
    
    # Настройка CORS для разрешения запросов с фронтенда
    # Используем явные origins из настроек, чтобы можно было использовать allow_credentials=True
    # Для добавления новых origins используйте переменную окружения CORS_ORIGINS
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    application.include_router(api_router)
    return application


app = create_app()


from functools import lru_cache

from pydantic import Field, PostgresDsn
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    environment: str = Field(default="local", alias="ENVIRONMENT")
    project_name: str = Field(default="Eywa Backend", alias="PROJECT_NAME")
    api_v1_prefix: str = "/api"
    database_url: PostgresDsn = Field(
        default="postgresql+psycopg://eywa:eywa@localhost:5432/eywa",
        alias="DATABASE_URL",
    )
    echo_sql: bool = Field(default=False, alias="ECHO_SQL")
    secret_key: str = Field(default="eywa-crm-secret-key-change-in-production", alias="SECRET_KEY")
    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://127.0.0.1:3000", "http://24eywa.ru", "https://24eywa.ru"],
        alias="CORS_ORIGINS"
    )

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


@lru_cache
def get_settings() -> Settings:
    return Settings()


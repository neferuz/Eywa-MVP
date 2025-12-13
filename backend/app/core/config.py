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
        default_factory=lambda: [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
            "http://24eywa.ru",
            "https://24eywa.ru"
        ],
        alias="CORS_ORIGINS"
    )
    openai_api_key: str = Field(default="", alias="OPENAI_API_KEY")
    timeweb_api_token: str = Field(default="", alias="TIMEWEB_API_TOKEN")
    timeweb_agent_access_id: str = Field(default="", alias="TIMEWEB_AGENT_ACCESS_ID")
    elevenlabs_api_key: str = Field(
        default="sk_40b82c8f085107b551eef776ddcbbaea2a77cb902c2a4c43",  # Ваш API ключ (из .env)
        alias="ELEVENLABS_API_KEY"
    )
    elevenlabs_voice_id: str = Field(
        default="aG9q1I1wTbfHh5sbpJnp",  # Voice ID из вашего .env
        alias="ELEVENLABS_VOICE_ID"
    )

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


@lru_cache
def get_settings() -> Settings:
    return Settings()


from pydantic import BaseModel


class AIAssistantRequest(BaseModel):
    """Запрос к AI ассистенту."""
    message: str
    conversation_history: list[dict] | None = None


class AIAssistantResponse(BaseModel):
    """Ответ от AI ассистента."""
    message: str
    data: dict | None = None  # Дополнительные данные, если запрос требует конкретных данных


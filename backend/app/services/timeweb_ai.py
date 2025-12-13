"""Сервис для работы с Timeweb Cloud AI API."""

import httpx
from typing import Optional

from app.core.config import get_settings


class TimewebAIService:
    """Сервис для взаимодействия с Timeweb Cloud AI API."""
    
    BASE_URL = "https://agent.timeweb.cloud"
    
    def __init__(self):
        settings = get_settings()
        self.api_token = settings.timeweb_api_token
        self.agent_access_id = settings.timeweb_agent_access_id
    
    def is_configured(self) -> bool:
        """Проверка, настроен ли сервис."""
        return bool(self.api_token and self.agent_access_id)
    
    async def call_agent(
        self,
        message: str,
        conversation_history: Optional[list[dict]] = None,
        system_prompt: Optional[str] = None,
    ) -> str:
        """Вызвать AI агента Timeweb Cloud.
        
        Args:
            message: Сообщение пользователя
            conversation_history: История разговора в формате [{"role": "user/assistant", "content": "..."}]
            system_prompt: Системный промпт (опционально)
            
        Returns:
            Ответ агента
        """
        if not self.is_configured():
            raise ValueError("Timeweb AI не настроен. Проверьте TIMEWEB_API_TOKEN и TIMEWEB_AGENT_ACCESS_ID")
        
        # Формируем сообщения для API
        messages = []
        
        # Добавляем системный промпт, если есть
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        # Добавляем историю разговора
        if conversation_history:
            messages.extend(conversation_history)
        
        # Добавляем текущее сообщение пользователя
        messages.append({"role": "user", "content": message})
        
        # URL для OpenAI-совместимого endpoint
        url = f"{self.BASE_URL}/api/v1/cloud-ai/agents/{self.agent_access_id}/v1/chat/completions"
        
        try:
            async with httpx.AsyncClient(timeout=40.0) as client:
                response = await client.post(
                    url,
                    headers={
                        "Authorization": f"Bearer {self.api_token}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "gpt-4",  # Модель игнорируется, но нужна для совместимости
                        "messages": messages,
                    },
                )
                
                response.raise_for_status()
                data = response.json()
                
                # Извлекаем ответ агента
                if data.get("choices") and len(data["choices"]) > 0:
                    return data["choices"][0]["message"]["content"].strip()
                else:
                    raise ValueError("Пустой ответ от Timeweb AI")
                    
        except httpx.HTTPStatusError as e:
            error_text = e.response.text if e.response else str(e)
            raise Exception(f"Ошибка Timeweb AI API: {e.response.status_code} - {error_text}")
        except httpx.TimeoutException:
            raise Exception("Превышено время ожидания ответа от Timeweb AI")
        except Exception as e:
            raise Exception(f"Ошибка при обращении к Timeweb AI: {str(e)}")
    
    async def call_agent_simple(
        self,
        message: str,
        system_prompt: Optional[str] = None,
    ) -> str:
        """Упрощенный вызов агента без истории.
        
        Args:
            message: Сообщение пользователя
            system_prompt: Системный промпт (опционально)
            
        Returns:
            Ответ агента
        """
        return await self.call_agent(message, conversation_history=None, system_prompt=system_prompt)


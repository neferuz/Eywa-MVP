import json
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from app.schemas.ai_assistant import AIAssistantRequest, AIAssistantResponse
from app.api.routes.auth import get_current_user
from app.schemas.auth import UserResponse
from app.db.session import get_session
from app.repositories.ai_assistant import AIAssistantRepository
from app.core.config import get_settings
from app.services.timeweb_ai import TimewebAIService

router = APIRouter(prefix="/api/ai-assistant", tags=["ai-assistant"])

OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"


def get_system_prompt() -> str:
    """Системный промпт для AI ассистента."""
    return """Ты — AI-помощник для CRM системы фитнес-центра и коворкинга Eywa. 

Твоя задача — помогать администраторам и владельцам бизнеса быстро получать информацию о состоянии бизнеса.

Правила общения:
- Отвечай дружелюбно, но профессионально
- Используй русский язык
- Будь кратким и конкретным
- Если не понял вопрос, вежливо попроси уточнить
- При ответе на вопросы используй данные, которые тебе предоставлены

Типы запросов, которые ты можешь обрабатывать:
1. Приветствия и small talk — отвечай дружелюбно
2. Вопросы о клиентах — используй данные из CRM
3. Вопросы о записях и расписании — используй данные из CRM
4. Вопросы о выручке — используй данные из CRM
5. Общие вопросы о бизнесе — используй предоставленные данные

Когда пользователь спрашивает про данные CRM, используй информацию из контекста "crm_data".
Форматируй числа красиво (например, 1000000 → "1 000 000 сум").

Примеры хороших ответов:
- "В базе {total_clients} клиентов, из них {active_clients} активных"
- "Сегодня {today_bookings} записей"
- "Выручка за сегодня составляет {revenue_today} сум"
- "На сегодня есть {available_slots_today} свободных слотов"

Если данных нет или они равны 0, скажи об этом честно."""


async def call_openai(
    user_message: str,
    system_prompt: str,
    conversation_history: list[dict] | None = None,
    crm_data: dict | None = None,
) -> str:
    """Вызвать OpenAI API для получения ответа."""
    
    settings = get_settings()
    openai_api_key = settings.openai_api_key
    
    if not openai_api_key:
        # Fallback ответ, если нет API ключа
        return "Извините, AI-ассистент временно недоступен. Пожалуйста, проверьте настройки API."
    
    messages = [
        {"role": "system", "content": system_prompt}
    ]
    
    # Добавляем историю разговора
    if conversation_history:
        messages.extend(conversation_history)
    
    # Добавляем данные CRM в контекст, если они есть
    if crm_data:
        crm_context = f"\n\nАктуальные данные CRM:\n{json.dumps(crm_data, ensure_ascii=False, indent=2)}"
        messages.append({
            "role": "system",
            "content": f"Используй эти данные для ответа на вопросы пользователя:{crm_context}"
        })
    
    # Добавляем текущий запрос пользователя
    messages.append({"role": "user", "content": user_message})
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                OPENAI_API_URL,
                headers={
                    "Authorization": f"Bearer {openai_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-4o-mini",  # Используем более дешевую модель для экономии
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 500,
                },
            )
            
            if response.status_code != 200:
                error_text = response.text
                print(f"OpenAI API error: {response.status_code} - {error_text}")
                return "Извините, произошла ошибка при обработке запроса. Попробуйте позже."
            
            data = response.json()
            assistant_message = data["choices"][0]["message"]["content"]
            return assistant_message.strip()
            
    except httpx.TimeoutException:
        return "Извините, запрос занял слишком много времени. Попробуйте позже."
    except Exception as e:
        print(f"Error calling OpenAI: {e}")
        return "Извините, произошла ошибка при обработке запроса. Попробуйте позже."


@router.post("/chat", response_model=AIAssistantResponse)
async def chat_with_assistant(
    request: AIAssistantRequest,
    current_user: Annotated[UserResponse, Depends(get_current_user)],
    session: AsyncSession = Depends(get_session),
) -> AIAssistantResponse:
    """Обработать запрос пользователя к AI ассистенту."""
    
    # Получаем статистику CRM
    repo = AIAssistantRepository(session)
    crm_stats = await repo.get_crm_stats()
    
    # Форматируем данные для лучшей читаемости
    formatted_stats = {
        "total_clients": crm_stats["total_clients"],
        "active_clients": crm_stats["active_clients"],
        "new_clients_today": crm_stats["new_clients_today"],
        "new_clients_week": crm_stats["new_clients_week"],
        "new_clients_month": crm_stats["new_clients_month"],
        "today_bookings": crm_stats["today_bookings"],
        "revenue_today": f"{int(crm_stats['revenue_today']):,}".replace(",", " "),
        "revenue_week": f"{int(crm_stats['revenue_week']):,}".replace(",", " "),
        "revenue_month": f"{int(crm_stats['revenue_month']):,}".replace(",", " "),
        "available_slots_today": crm_stats["available_slots_today"],
    }
    
    # Получаем ответ от AI (приоритет Timeweb, затем OpenAI)
    system_prompt = get_system_prompt()
    
    # Добавляем данные CRM в системный промпт
    if formatted_stats:
        crm_context = f"\n\nАктуальные данные CRM:\n{json.dumps(formatted_stats, ensure_ascii=False, indent=2)}"
        system_prompt_with_data = f"{system_prompt}\n\n{crm_context}"
    else:
        system_prompt_with_data = system_prompt
    
    assistant_message = ""
    
    # Используем Timeweb AI (основной провайдер)
    timeweb_service = TimewebAIService()
    if timeweb_service.is_configured():
        try:
            assistant_message = await timeweb_service.call_agent(
                message=request.message,
                conversation_history=request.conversation_history,
                system_prompt=system_prompt_with_data,
            )
        except Exception as e:
            print(f"Timeweb AI error: {e}")
            # Если Timeweb недоступен, пробуем OpenAI как fallback (если настроен)
            settings = get_settings()
            if settings.openai_api_key:
                try:
                    assistant_message = await call_openai(
                        user_message=request.message,
                        system_prompt=system_prompt_with_data,
                        conversation_history=request.conversation_history,
                        crm_data=None,  # Уже в system_prompt
                    )
                except Exception as openai_error:
                    print(f"OpenAI fallback error: {openai_error}")
                    assistant_message = "Извините, AI-ассистент временно недоступен. Попробуйте позже."
            else:
                assistant_message = "Извините, AI-ассистент временно недоступен. Проверьте настройки Timeweb API."
    else:
        # Если Timeweb не настроен, используем OpenAI (если настроен)
        settings = get_settings()
        if settings.openai_api_key:
            assistant_message = await call_openai(
                user_message=request.message,
                system_prompt=system_prompt_with_data,
                conversation_history=request.conversation_history,
                crm_data=None,  # Уже в system_prompt
            )
        else:
            assistant_message = "Извините, AI-ассистент не настроен. Пожалуйста, настройте Timeweb API или OpenAI API."
    
    return AIAssistantResponse(
        message=assistant_message,
        data=formatted_stats if any(keyword in request.message.lower() for keyword in [
            "статистика", "данные", "информация", "сколько", "выручка", "клиент", "запись"
        ]) else None,
    )


@router.get("/stats")
async def get_crm_stats_for_assistant(
    current_user: Annotated[UserResponse, Depends(get_current_user)],
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Получить статистику CRM для AI ассистента (для отладки)."""
    repo = AIAssistantRepository(session)
    stats = await repo.get_crm_stats()
    
    # Форматируем для ответа
    return {
        "total_clients": stats["total_clients"],
        "active_clients": stats["active_clients"],
        "new_clients_today": stats["new_clients_today"],
        "new_clients_week": stats["new_clients_week"],
        "new_clients_month": stats["new_clients_month"],
        "today_bookings": stats["today_bookings"],
        "revenue_today": stats["revenue_today"],
        "revenue_week": stats["revenue_week"],
        "revenue_month": stats["revenue_month"],
        "available_slots_today": stats["available_slots_today"],
    }


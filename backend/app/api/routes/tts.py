"""Text-to-Speech endpoint using ElevenLabs."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Annotated
import httpx

from app.api.routes.auth import get_current_user
from app.schemas.auth import UserResponse
from app.core.config import get_settings

router = APIRouter(prefix="/api/tts", tags=["tts"])


class TTSRequest(BaseModel):
    text: str


@router.get("/voices")
async def get_voices(
    current_user: Annotated[UserResponse, Depends(get_current_user)],
) -> dict:
    """Получить список доступных голосов ElevenLabs.
    
    Returns:
        Список голосов с информацией
    """
    settings = get_settings()
    api_key = settings.elevenlabs_api_key
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ElevenLabs API ключ не настроен. Проверьте ELEVENLABS_API_KEY"
        )
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                "https://api.elevenlabs.io/v1/voices",
                headers={
                    "xi-api-key": api_key,
                },
            )
            
            if response.status_code != 200:
                error_text = response.text
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Ошибка ElevenLabs API: {error_text}"
                )
            
            data = response.json()
            
            # Фильтруем русские женские голоса
            russian_female_voices = []
            for voice in data.get("voices", []):
                # Проверяем, есть ли русский язык в поддерживаемых языках
                labels = voice.get("labels", {})
                gender = labels.get("gender", "").lower()
                language = labels.get("accent", "").lower()
                
                # Ищем русские женские голоса
                if gender == "female" and ("russian" in language or "ru" in language or voice.get("name", "").lower() in ["calm", "soft", "professional", "friendly"]):
                    russian_female_voices.append({
                        "voice_id": voice.get("voice_id"),
                        "name": voice.get("name"),
                        "description": voice.get("description"),
                        "labels": labels,
                    })
            
            return {
                "all_voices": data.get("voices", []),
                "russian_female_voices": russian_female_voices,
                "recommended": russian_female_voices[0] if russian_female_voices else None,
            }
            
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Превышено время ожидания ответа от ElevenLabs"
        )
    except Exception as e:
        print(f"Error getting voices: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при получении списка голосов: {str(e)}"
        )


@router.post("/speak")
async def text_to_speech(
    request: TTSRequest,
    current_user: Annotated[UserResponse, Depends(get_current_user)],
) -> Response:
    """Преобразовать текст в речь с помощью ElevenLabs.
    
    Args:
        request: Запрос с текстом для озвучивания
        
    Returns:
        Audio file (MP3) as binary response
    """
    settings = get_settings()
    api_key = settings.elevenlabs_api_key
    voice_id = settings.elevenlabs_voice_id
    
    # Используем значения по умолчанию, если не заданы в .env
    if not api_key:
        api_key = "sk_40b82c8f085107b551eef776ddcbbaea2a77cb902c2a4c43"  # Ваш API ключ
    if not voice_id:
        voice_id = "aG9q1I1wTbfHh5sbpJnp"  # Voice ID из вашего .env
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ElevenLabs TTS не настроен. Проверьте ELEVENLABS_API_KEY и ELEVENLABS_VOICE_ID"
        )
    
    text = request.text
    if not text or not text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Текст не может быть пустым"
        )
    
    try:
        # Используем официальный ElevenLabs API через httpx
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
                headers={
                    "xi-api-key": api_key,
                    "Content-Type": "application/json",
                },
                json={
                    "text": text,
                    "model_id": "eleven_multilingual_v2",  # Поддерживает русский
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.75,
                        "style": 0.0,
                        "use_speaker_boost": True
                    },
                    "output_format": "mp3_44100_128",  # Высокое качество MP3
                },
            )
            
            if response.status_code != 200:
                error_text = response.text
                print(f"ElevenLabs API error: {response.status_code} - {error_text}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Ошибка ElevenLabs API: {error_text}"
                )
            
            # Возвращаем аудио как MP3
            return Response(
                content=response.content,
                media_type="audio/mpeg",
                headers={
                    "Content-Disposition": "inline; filename=speech.mp3",
                    "Cache-Control": "no-cache",
                }
            )
            
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Превышено время ожидания ответа от ElevenLabs"
        )
    except httpx.HTTPStatusError as e:
        error_text = e.response.text if e.response else str(e)
        print(f"ElevenLabs HTTP error: {e.response.status_code if e.response else 'unknown'} - {error_text}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Ошибка ElevenLabs API: {error_text}"
        )
    except Exception as e:
        print(f"Error calling ElevenLabs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при генерации речи: {str(e)}"
        )


from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path

router = APIRouter(prefix="/api/audio", tags=["audio"])

# Путь к директории с аудио файлами (от корня проекта)
# backend/app/api/routes/audio.py -> backend/
AUDIO_DIR = Path(__file__).parent.parent.parent.parent


@router.get("/notferuz.mp3")
async def get_notferuz_audio():
    """Получить аудио файл для notferuz@gmail.com"""
    # Путь: backend/notferuz.mp3 (от корня проекта backend/)
    audio_path = Path(__file__).parent.parent.parent.parent / "notferuz.mp3"
    if not audio_path.exists():
        raise HTTPException(status_code=404, detail=f"Audio file not found at {audio_path}")
    return FileResponse(
        path=str(audio_path),
        media_type="audio/mpeg",
        filename="notferuz.mp3",
    )


@router.get("/anastasiya.mp3")
async def get_anastasiya_audio():
    """Получить аудио файл для anastasiya.polovinkina@gmail.com"""
    # Путь: backend/anastasiya.mp3 (от корня проекта backend/)
    audio_path = Path(__file__).parent.parent.parent.parent / "anastasiya.mp3"
    if not audio_path.exists():
        raise HTTPException(status_code=404, detail=f"Audio file not found at {audio_path}")
    return FileResponse(
        path=str(audio_path),
        media_type="audio/mpeg",
        filename="anastasiya.mp3",
    )


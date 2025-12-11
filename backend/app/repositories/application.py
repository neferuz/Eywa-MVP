from __future__ import annotations

import uuid
from datetime import datetime, timedelta

from sqlalchemy import Select, select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.application import Application as ApplicationModel
from app.schemas.application import (
    Application as ApplicationSchema,
    ApplicationCreate,
    ApplicationUpdate,
    Platform,
    Stage,
    ChatMessage,
)


class ApplicationRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    def _base_query(self) -> Select[tuple[ApplicationModel]]:
        return select(ApplicationModel)

    async def create(self, data: ApplicationCreate) -> ApplicationSchema:
        """Создать новую заявку"""
        public_id = str(uuid.uuid4())
        
        # Преобразуем chat_history в JSON
        chat_history_json = None
        if data.chat_history:
            chat_history_json = [msg.model_dump() for msg in data.chat_history]
        
        application = ApplicationModel(
            public_id=public_id,
            name=data.name,
            username=data.username,
            phone=data.phone,
            platform=data.platform.value,
            stage=data.stage.value,
            message=data.message,
            budget=data.budget,
            owner=data.owner,
            chat_history=chat_history_json,
            telegram_chat_id=data.telegram_chat_id,
        )
        
        self.session.add(application)
        await self.session.commit()
        await self.session.refresh(application)
        
        return self._to_schema(application)

    async def update(
        self, 
        public_id: str, 
        data: ApplicationUpdate
    ) -> ApplicationSchema | None:
        """Обновить заявку"""
        stmt = select(ApplicationModel).where(ApplicationModel.public_id == public_id)
        application = await self.session.scalar(stmt)
        
        if not application:
            return None
        
        if data.stage is not None:
            application.stage = data.stage.value
        if data.message is not None:
            application.message = data.message
        if data.budget is not None:
            application.budget = data.budget
        if data.owner is not None:
            application.owner = data.owner
        if data.chat_history is not None:
            application.chat_history = [msg.model_dump() for msg in data.chat_history]
        
        await self.session.commit()
        await self.session.refresh(application)
        
        return self._to_schema(application)

    async def get_by_public_id(self, public_id: str) -> ApplicationSchema | None:
        """Получить заявку по public_id"""
        stmt = select(ApplicationModel).where(ApplicationModel.public_id == public_id)
        application = await self.session.scalar(stmt)
        
        if not application:
            return None
        
        return self._to_schema(application)

    async def list_applications(
        self,
        platform: Platform | None = None,
        stage: Stage | None = None,
    ) -> list[ApplicationSchema]:
        """Получить список заявок с фильтрацией"""
        stmt = self._base_query()
        
        if platform:
            stmt = stmt.where(ApplicationModel.platform == platform.value)
        if stage:
            stmt = stmt.where(ApplicationModel.stage == stage.value)
        
        # Сортируем по дате создания (новые сначала)
        stmt = stmt.order_by(ApplicationModel.created_at.desc())
        
        result = await self.session.scalars(stmt)
        applications = result.all()
        
        return [self._to_schema(app) for app in applications]

    async def get_by_telegram_chat_id(
        self, 
        telegram_chat_id: int
    ) -> ApplicationSchema | None:
        """Получить заявку по telegram_chat_id"""
        stmt = select(ApplicationModel).where(
            ApplicationModel.telegram_chat_id == telegram_chat_id
        )
        application = await self.session.scalar(stmt)
        
        if not application:
            return None
        
        return self._to_schema(application)

    @staticmethod
    def _to_schema(model: ApplicationModel) -> ApplicationSchema:
        """Преобразовать модель в схему"""
        # Определяем platformName и platformAccent
        platform_name = "Instagram" if model.platform == "instagram" else "Telegram"
        platform_accent = "#F97316" if model.platform == "instagram" else "#60A5FA"
        
        # Определяем stageLabel
        stage_labels = {
            "inquiry": "Спросили цену",
            "trial": "Записались на пробный",
            "sale": "Оплатили абонемент",
        }
        stage_label = stage_labels.get(model.stage, model.stage)
        
        # Форматируем lastActivity
        if model.updated_at:
            now = datetime.now(model.updated_at.tzinfo) if model.updated_at.tzinfo else datetime.now()
            diff = now - model.updated_at
            
            if diff < timedelta(minutes=1):
                last_activity = "только что"
            elif diff < timedelta(hours=1):
                minutes = int(diff.total_seconds() / 60)
                last_activity = f"{minutes} мин назад"
            elif diff < timedelta(hours=24):
                hours = int(diff.total_seconds() / 3600)
                last_activity = f"{hours} ч назад"
            elif diff < timedelta(days=2):
                last_activity = "Вчера"
            else:
                last_activity = model.updated_at.strftime("%d.%m.%Y")
        else:
            last_activity = "недавно"
        
        # Преобразуем chat_history
        chat_history = None
        if model.chat_history:
            chat_history = [ChatMessage(**msg) for msg in model.chat_history]
        
        return ApplicationSchema(
            id=model.public_id,
            name=model.name,
            username=model.username,
            phone=model.phone,
            platform=Platform(model.platform),
            platformName=platform_name,
            platformAccent=platform_accent,
            stage=Stage(model.stage),
            stageLabel=stage_label,
            message=model.message,
            budget=model.budget,
            owner=model.owner,
            lastActivity=last_activity,
            chatHistory=chat_history,
        )


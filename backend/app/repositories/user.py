from __future__ import annotations

from typing import List

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.core.security import get_password_hash


class UserRepository:
    """Репозиторий для работы с пользователями."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_email(self, email: str) -> User | None:
        """Получить пользователя по email."""
        result = await self.session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def create(self, email: str, password: str, is_super_admin: bool = False) -> User:
        """Создать нового пользователя."""
        password_hash = get_password_hash(password)
        user = User(
            email=email,
            password_hash=password_hash,
            is_super_admin=is_super_admin,
            is_active=True,
        )
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def create_full(
        self,
        *,
        email: str,
        password: str,
        name: str | None,
        role: str,
        access: List[str],
        is_active: bool = True,
    ) -> User:
        """Создать пользователя с расширенными полями."""
        password_hash = get_password_hash(password)
        user = User(
            email=email,
            password_hash=password_hash,
            is_super_admin=role == "super_admin",
            is_active=is_active,
            name=name,
            role=role,
            access=access,
        )
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def get_by_id(self, user_id: int) -> User | None:
        """Получить пользователя по ID."""
        result = await self.session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def list(self) -> List[User]:
        result = await self.session.execute(select(User).order_by(User.id))
        return result.scalars().all()

    async def delete(self, user_id: int) -> bool:
        result = await self.session.execute(delete(User).where(User.id == user_id))
        await self.session.commit()
        return result.rowcount > 0

    async def update(
        self,
        user_id: int,
        *,
        email: str | None = None,
        password: str | None = None,
        name: str | None = None,
        role: str | None = None,
        access: List[str] | None = None,
        is_active: bool | None = None,
    ) -> User | None:
        """Обновить пользователя."""
        user = await self.get_by_id(user_id)
        if not user:
            return None

        if email is not None:
            user.email = email
        if password is not None:
            user.password_hash = get_password_hash(password)
        if name is not None:
            user.name = name
        if role is not None:
            user.role = role
            user.is_super_admin = role == "super_admin"
        if access is not None:
            user.access = access
        if is_active is not None:
            user.is_active = is_active

        await self.session.commit()
        await self.session.refresh(user)
        return user


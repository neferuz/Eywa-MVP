from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.db.session import get_session
from app.repositories.categories import CategoryRepository
from app.schemas.category import Category, CategoryCreate, CategoryUpdate

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("", response_model=list[Category])
async def list_categories(session: AsyncSession = Depends(get_session)) -> list[Category]:
    try:
        repo = CategoryRepository(session)
        result = await repo.list_categories()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching categories: {str(e)}")


@router.post("", response_model=Category, status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: CategoryCreate,
    session: AsyncSession = Depends(get_session),
) -> Category:
    repo = CategoryRepository(session)
    # Проверяем, существует ли категория с таким именем
    existing = await repo.get_by_name(payload.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category with name '{payload.name}' already exists"
        )
    try:
        return await repo.create_category(payload)
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category with name '{payload.name}' already exists"
        )


@router.patch("/{category_id}", response_model=Category)
async def update_category(
    category_id: str,
    payload: CategoryUpdate,
    session: AsyncSession = Depends(get_session),
) -> Category:
    repo = CategoryRepository(session)
    # Проверяем, существует ли категория
    existing = await repo.get_by_public_id(category_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    
    # Если обновляется имя, проверяем на дублирование
    if payload.name and payload.name != existing.name:
        name_check = await repo.get_by_name(payload.name)
        if name_check:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category with name '{payload.name}' already exists"
            )
    
    try:
        category = await repo.update_category(category_id, payload)
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        return category
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category name already exists"
        )


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: str,
    session: AsyncSession = Depends(get_session),
) -> None:
    repo = CategoryRepository(session)
    deleted = await repo.delete_category(category_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")


from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.db.session import get_session
from app.repositories.payment_services import PaymentServiceRepository, PaymentServiceCategoryRepository
from app.schemas.payment_service import (
    PaymentService,
    PaymentServiceCreate,
    PaymentServiceUpdate,
    PaymentServiceCategory,
    PaymentServiceCategoryCreate,
    PaymentServiceCategoryUpdate,
)

router = APIRouter(prefix="/api/payment-services", tags=["payment-services"])


# Category endpoints
@router.get("/categories", response_model=list[PaymentServiceCategory])
async def list_categories(session: AsyncSession = Depends(get_session)) -> list[PaymentServiceCategory]:
    try:
        repo = PaymentServiceCategoryRepository(session)
        result = await repo.list_categories()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching categories: {str(e)}")


@router.post("/categories", response_model=PaymentServiceCategory, status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: PaymentServiceCategoryCreate,
    session: AsyncSession = Depends(get_session),
) -> PaymentServiceCategory:
    repo = PaymentServiceCategoryRepository(session)
    try:
        return await repo.create_category(payload)
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error creating category"
        )


@router.patch("/categories/{category_id}", response_model=PaymentServiceCategory)
async def update_category(
    category_id: str,
    payload: PaymentServiceCategoryUpdate,
    session: AsyncSession = Depends(get_session),
) -> PaymentServiceCategory:
    repo = PaymentServiceCategoryRepository(session)
    existing = await repo.get_by_public_id(category_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    
    try:
        result = await repo.update_category(category_id, payload)
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        return result
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error updating category"
        )


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: str,
    session: AsyncSession = Depends(get_session),
):
    repo = PaymentServiceCategoryRepository(session)
    success = await repo.delete_category(category_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")


# Service endpoints
@router.get("", response_model=list[PaymentService])
async def list_services(session: AsyncSession = Depends(get_session)) -> list[PaymentService]:
    try:
        repo = PaymentServiceRepository(session)
        result = await repo.list_services()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching services: {str(e)}")


@router.get("/categories/{category_id}/services", response_model=list[PaymentService])
async def list_services_by_category(
    category_id: int,
    session: AsyncSession = Depends(get_session),
) -> list[PaymentService]:
    try:
        repo = PaymentServiceRepository(session)
        result = await repo.list_services_by_category(category_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching services: {str(e)}")


@router.post("", response_model=PaymentService, status_code=status.HTTP_201_CREATED)
async def create_service(
    payload: PaymentServiceCreate,
    session: AsyncSession = Depends(get_session),
) -> PaymentService:
    repo = PaymentServiceRepository(session)
    # Проверяем, существует ли категория
    category_repo = PaymentServiceCategoryRepository(session)
    category = await category_repo.get_by_id(payload.category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category with id {payload.category_id} not found"
        )
    try:
        return await repo.create_service(payload)
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error creating service"
        )


@router.patch("/{service_id}", response_model=PaymentService)
async def update_service(
    service_id: str,
    payload: PaymentServiceUpdate,
    session: AsyncSession = Depends(get_session),
) -> PaymentService:
    """Обновление услуги.
    
    При обновлении можно указать только необходимые поля:
    - category_id: ID категории
    - name: Название услуги
    - price: Стоимость в сумах
    - duration: Длительность в виде количества занятий/визитов (например: "12 занятий")
    - description: Описание услуги
    
    Поля `billing` и `trainer` не используются в форме редактирования.
    """
    repo = PaymentServiceRepository(session)
    existing = await repo.get_by_public_id(service_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    
    # Если обновляется category_id, проверяем, существует ли категория
    if payload.category_id is not None:
        category_repo = PaymentServiceCategoryRepository(session)
        category = await category_repo.get_by_id(payload.category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category with id {payload.category_id} not found"
            )
    
    try:
        result = await repo.update_service(service_id, payload)
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
        return result
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error updating service"
        )


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(
    service_id: str,
    session: AsyncSession = Depends(get_session),
):
    repo = PaymentServiceRepository(session)
    success = await repo.delete_service(service_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")


from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.repositories.payment import PaymentRepository
from app.schemas.payment import Payment, PaymentCreate, PaymentUpdate

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.get("", response_model=list[Payment])
async def list_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    service_name: str | None = Query(None),
    client_id: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
) -> list[Payment]:
    try:
        repo = PaymentRepository(session)
        result = await repo.list_payments(
            skip=skip, limit=limit, service_name=service_name, client_id=client_id
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching payments: {str(e)}"
        )


@router.post("", response_model=Payment, status_code=status.HTTP_201_CREATED)
async def create_payment(
    payload: PaymentCreate,
    session: AsyncSession = Depends(get_session),
) -> Payment:
    try:
        # Убеждаемся, что quantity >= 1 при создании
        if payload.quantity < 1:
            payload.quantity = 1
        repo = PaymentRepository(session)
        return await repo.create_payment(payload)
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error creating payment: {str(e)}",
        )


@router.get("/{payment_public_id}", response_model=Payment)
async def get_payment(
    payment_public_id: str,
    session: AsyncSession = Depends(get_session),
) -> Payment:
    repo = PaymentRepository(session)
    payment = await repo.get_by_public_id(payment_public_id)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found"
        )
    return payment


@router.patch("/{payment_public_id}", response_model=Payment)
async def update_payment(
    payment_public_id: str,
    payload: PaymentUpdate,
    session: AsyncSession = Depends(get_session),
) -> Payment:
    repo = PaymentRepository(session)
    existing = await repo.get_by_public_id(payment_public_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found"
        )
    try:
        updated_payment = await repo.update_payment(payment_public_id, payload)
        if not updated_payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found"
            )
        return updated_payment
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error updating payment: {str(e)}",
        )


@router.delete("/{payment_public_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payment(
    payment_public_id: str,
    session: AsyncSession = Depends(get_session),
) -> None:
    repo = PaymentRepository(session)
    existing = await repo.get_by_public_id(payment_public_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found"
        )
    await repo.delete_payment(payment_public_id)


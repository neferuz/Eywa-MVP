from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from fastapi import status

from app.schemas.client import Client, ClientCreate, ClientUpdate
from app.db.session import get_session
from app.repositories.clients import ClientRepository

router = APIRouter()


@router.get("/clients", response_model=list[Client])
async def list_clients(
    query: Annotated[str | None, Query(description="Search by name, phone or instagram handle")] = None,
    direction: Annotated[
        Literal["Body", "Coworking", "Coffee"] | None,
        Query(description="Filter by business direction"),
    ] = None,
    status: Annotated[
        Literal["Активный", "Новый", "Ушедший"] | None,
        Query(description="Filter by lifecycle status"),
    ] = None,
    session: AsyncSession = Depends(get_session),
) -> list[Client]:
    """
    List clients with optional filtering (Postgres-backed, mock fallback).
    """
    repo = ClientRepository(session)
    return await repo.list_clients(query=query, direction=direction, status=status)


@router.get("/clients/{client_id}", response_model=Client)
async def get_client(
    client_id: str,
    session: AsyncSession = Depends(get_session),
) -> Client:
    repo = ClientRepository(session)
    client = await repo.get_by_public_id(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.post("/clients", response_model=Client, status_code=status.HTTP_201_CREATED)
async def create_client(
    payload: ClientCreate,
    session: AsyncSession = Depends(get_session),
) -> Client:
    repo = ClientRepository(session)
    return await repo.create_client(payload)


@router.patch("/clients/{client_id}", response_model=Client)
async def update_client(
    client_id: str,
    payload: ClientUpdate,
    session: AsyncSession = Depends(get_session),
) -> Client:
    repo = ClientRepository(session)
    client = await repo.update_client(client_id, payload)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from fastapi import status

from app.schemas.client import Client, ClientCreate, ClientUpdate
from app.db.session import get_session
from app.repositories.clients import ClientRepository

router = APIRouter()


@router.get("/clients/{client_id}", response_model=Client, response_model_by_alias=False)
async def get_client(
    client_id: str,
    session: AsyncSession = Depends(get_session),
) -> Client:
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"GET /api/clients/{client_id} - fetching client")
    
    repo = ClientRepository(session)
    client = await repo.get_by_public_id(client_id)
    if not client:
        logger.warning(f"Client {client_id} not found")
        raise HTTPException(status_code=404, detail="Client not found")
    
    logger.info(f"Client {client_id} found: contractNumber={client.contractNumber}, subscriptionNumber={client.subscriptionNumber}, birthDate={client.birthDate}")
    return client


@router.get("/clients", response_model=list[Client], response_model_by_alias=False)
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
    List clients with optional filtering (Postgres-backed only, no mock fallback).
    
    **Важно:** Если query не указан, возвращаются клиенты только при наличии фильтров (direction или status).
    Для получения всех клиентов используйте GET /api/clients/all
    """
    repo = ClientRepository(session)
    result = await repo.list_clients(query=query, direction=direction, status=status)
    
    # Логируем для отладки
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"GET /api/clients - query={query}, direction={direction}, status={status}, found={len(result)} clients")
    
    return result


@router.get("/clients/all", response_model=list[Client], response_model_by_alias=False)
async def list_all_clients(
    session: AsyncSession = Depends(get_session),
) -> list[Client]:
    """
    Получить всех клиентов из базы данных (для проверки наличия данных).
    Используйте этот эндпоинт для проверки, есть ли клиенты в базе.
    """
    from sqlalchemy import select
    from app.models.client import Client as ClientModel
    
    stmt = select(ClientModel).order_by(ClientModel.name)
    result = await session.scalars(stmt)
    rows = result.all()
    
    repo = ClientRepository(session)
    # Используем статический метод для преобразования
    clients = [ClientRepository._to_schema(obj) for obj in rows]
    
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"GET /api/clients/all - found {len(clients)} total clients in database")
    if len(clients) > 0:
        logger.info(f"Sample clients: {[(c.name, c.direction, c.status) for c in clients[:5]]}")
    
    return clients


@router.post("/clients", response_model=Client, status_code=status.HTTP_201_CREATED, response_model_by_alias=False)
async def create_client(
    payload: ClientCreate,
    session: AsyncSession = Depends(get_session),
) -> Client:
    try:
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Creating client with payload: {payload.model_dump()}")
        
        repo = ClientRepository(session)
        result = await repo.create_client(payload)
        logger.info(f"Client created successfully: {result.id}")
        return result
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error creating client: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating client: {str(e)}"
        )


@router.patch("/clients/{client_id}", response_model=Client, response_model_by_alias=False)
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


@router.post("/clients/{client_id}/visits", response_model=Client, response_model_by_alias=False)
async def add_client_visit(
    client_id: str,
    visit_date: Annotated[str | None, Query(description="Дата визита в формате YYYY-MM-DD. Если не указана, используется текущая дата.")] = None,
    session: AsyncSession = Depends(get_session),
) -> Client:
    """
    Добавить визит клиента.
    Если visit_date не указана, используется текущая дата (YYYY-MM-DD).
    """
    repo = ClientRepository(session)
    client = await repo.add_visit(client_id, visit_date)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.delete("/clients/{client_id}/visits", response_model=Client, response_model_by_alias=False)
async def remove_client_visit(
    client_id: str,
    visit_date: Annotated[str, Query(description="Дата визита в формате YYYY-MM-DD для удаления.")],
    session: AsyncSession = Depends(get_session),
) -> Client:
    """
    Удалить визит клиента по дате.
    """
    repo = ClientRepository(session)
    client = await repo.remove_visit(client_id, visit_date)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


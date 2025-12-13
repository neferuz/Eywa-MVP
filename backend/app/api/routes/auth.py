from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import verify_password, create_access_token, decode_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from app.db.session import get_session
from app.repositories.user import UserRepository
from app.schemas.auth import Token, UserResponse, LoginRequest

router = APIRouter(tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_session),
) -> UserResponse:
    """Получить текущего пользователя из токена."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception
    
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise credentials_exception
    
    repo = UserRepository(session)
    user = await repo.get_by_id(user_id)
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")
    
    return UserResponse.model_validate(user)


@router.post("/login", response_model=Token)
async def login(
    login_data: LoginRequest,
    session: AsyncSession = Depends(get_session),
) -> Token:
    """Вход в систему."""
    import logging
    logger = logging.getLogger(__name__)
    
    repo = UserRepository(session)
    user = await repo.get_by_email(login_data.email)
    
    logger.info(f"Login attempt for email: {login_data.email}, user found: {user is not None}")
    
    if not user:
        logger.warning(f"User not found: {login_data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    logger.info(f"User found: {user.email}, checking password...")
    password_valid = verify_password(login_data.password, user.password_hash)
    logger.info(f"Password check result: {password_valid}")
    
    if not password_valid:
        logger.warning(f"Invalid password for user: {login_data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "is_super_admin": user.is_super_admin},
        expires_delta=access_token_expires,
    )
    
    return Token(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: UserResponse = Depends(get_current_user),
) -> UserResponse:
    """Получить информацию о текущем пользователе."""
    return current_user




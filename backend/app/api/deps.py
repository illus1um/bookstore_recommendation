"""
Dependencies для FastAPI endpoints.
"""
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.models.user import User
from app.core.security import decode_access_token
from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """
    Получает текущего пользователя из JWT токена.
    
    Args:
        token: JWT токен из заголовка Authorization
        
    Returns:
        Объект пользователя
        
    Raises:
        HTTPException: Если токен невалидный или пользователь не найден
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось подтвердить учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
    
    user = await User.find_one(User.email == email)
    if user is None:
        raise credentials_exception
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Проверяет, что пользователь активен.
    
    Args:
        current_user: Текущий пользователь
        
    Returns:
        Объект пользователя
        
    Raises:
        HTTPException: Если пользователь неактивен
    """
    # Здесь можно добавить проверку на is_active, если нужно
    return current_user


async def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Проверяет, что пользователь является администратором.
    
    Args:
        current_user: Текущий пользователь
        
    Returns:
        Объект пользователя-администратора
        
    Raises:
        HTTPException: Если пользователь не является администратором
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав доступа"
        )
    return current_user


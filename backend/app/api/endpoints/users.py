"""
API endpoints для работы с пользователями.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.user import User
from app.models.interaction import Interaction
from app.schemas.user import User as UserSchema, UserUpdate, UserPreferences
from app.schemas.interaction import Interaction as InteractionSchema
from app.api.deps import get_current_user, get_current_active_user

router = APIRouter()


@router.get("/{user_id}", response_model=UserSchema)
async def get_user(user_id: str, current_user: User = Depends(get_current_active_user)):
    """
    Получает профиль пользователя по ID.
    
    Args:
        user_id: ID пользователя
        current_user: Текущий пользователь
        
    Returns:
        Профиль пользователя
        
    Raises:
        HTTPException: Если пользователь не найден
    """
    user = await User.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    return user


@router.put("/{user_id}", response_model=UserSchema)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """
    Обновляет профиль пользователя.
    
    Args:
        user_id: ID пользователя
        user_update: Данные для обновления
        current_user: Текущий пользователь
        
    Returns:
        Обновленный профиль пользователя
        
    Raises:
        HTTPException: Если пользователь не найден или нет прав
    """
    # Проверяем, что пользователь обновляет свой профиль или является админом
    if user_id != str(current_user.id) and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для обновления этого профиля"
        )
    
    user = await User.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    # Обновляем только переданные поля
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    await user.save()
    return user


@router.get("/{user_id}/history", response_model=List[InteractionSchema])
async def get_user_history(
    user_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Получает историю взаимодействий пользователя.
    
    Args:
        user_id: ID пользователя
        current_user: Текущий пользователь
        
    Returns:
        Список взаимодействий пользователя
        
    Raises:
        HTTPException: Если пользователь не найден или нет прав
    """
    # Проверяем, что пользователь запрашивает свою историю или является админом
    if user_id != str(current_user.id) and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для просмотра этой истории"
        )
    
    user = await User.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    interactions = await Interaction.find(
        Interaction.user_id == user.id
    ).sort(-Interaction.timestamp).to_list()
    
    return interactions


@router.put("/{user_id}/preferences", response_model=UserSchema)
async def update_user_preferences(
    user_id: str,
    preferences: UserPreferences,
    current_user: User = Depends(get_current_active_user)
):
    """
    Обновляет предпочтения пользователя (жанры и авторы).
    
    Args:
        user_id: ID пользователя
        preferences: Новые предпочтения
        current_user: Текущий пользователь
        
    Returns:
        Обновленный профиль пользователя
        
    Raises:
        HTTPException: Если пользователь не найден или нет прав
    """
    # Проверяем, что пользователь обновляет свои предпочтения или является админом
    if user_id != str(current_user.id) and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для обновления этих предпочтений"
        )
    
    user = await User.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    user.favorite_genres = preferences.favorite_genres
    user.favorite_authors = preferences.favorite_authors
    
    await user.save()
    return user


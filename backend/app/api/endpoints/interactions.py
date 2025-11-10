"""
API endpoints для работы с взаимодействиями.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.interaction import Interaction, InteractionType
from app.models.user import User
from app.models.book import Book
from app.schemas.interaction import InteractionCreate, Interaction as InteractionSchema
from app.api.deps import get_current_user, get_current_active_user

router = APIRouter()


@router.post("/", response_model=InteractionSchema, status_code=status.HTTP_201_CREATED)
async def create_interaction(
    interaction_data: InteractionCreate,
    current_user: User = Depends(get_current_active_user)
):
    """
    Создает новое взаимодействие (view, like, cart, purchase, review).
    
    Args:
        interaction_data: Данные взаимодействия
        current_user: Текущий пользователь
        
    Returns:
        Созданное взаимодействие
        
    Raises:
        HTTPException: Если книга не найдена
    """
    # Проверяем, что книга существует (мягкая проверка для VIEW)
    book = None
    try:
        book = await Book.get(interaction_data.book_id)
    except Exception as e:
        # Логируем ошибку для отладки
        print(f"Ошибка при поиске книги {interaction_data.book_id}: {e}")
    
    # Для критичных действий (не VIEW) требуем существование книги
    if not book and interaction_data.interaction_type != InteractionType.VIEW:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Книга не найдена"
        )
    
    # Если это review, обновляем средний рейтинг книги
    if book and interaction_data.interaction_type == InteractionType.REVIEW:
        rating = interaction_data.metadata.get("rating")
        if rating and isinstance(rating, (int, float)) and 1 <= rating <= 5:
            # Получаем все рейтинги для этой книги
            reviews = await Interaction.find(
                Interaction.book_id == book.id,
                Interaction.interaction_type == InteractionType.REVIEW
            ).to_list()
            
            # Вычисляем новый средний рейтинг
            ratings = [
                r.metadata.rating
                for r in reviews
                if getattr(r.metadata, "rating", None) is not None
            ]
            ratings.append(rating)
            book.average_rating = sum(ratings) / len(ratings)
            await book.save()
    
    # Создаем взаимодействие
    interaction = Interaction(
        user_id=current_user.id,
        book_id=interaction_data.book_id,
        interaction_type=interaction_data.interaction_type,
        metadata=interaction_data.metadata
    )
    
    await interaction.insert()
    return interaction


@router.get("/user/{user_id}", response_model=List[InteractionSchema])
async def get_user_interactions(
    user_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Получает все взаимодействия пользователя.
    
    Args:
        user_id: ID пользователя
        current_user: Текущий пользователь
        
    Returns:
        Список взаимодействий пользователя
        
    Raises:
        HTTPException: Если пользователь не найден или нет прав
    """
    # Проверяем, что пользователь запрашивает свои взаимодействия или является админом
    if user_id != str(current_user.id) and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для просмотра этих взаимодействий"
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


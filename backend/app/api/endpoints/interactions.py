"""
API endpoints для работы с взаимодействиями.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.models.interaction import Interaction, InteractionType
from app.models.user import User
from app.models.book import Book
from app.schemas.interaction import (
    InteractionCreate,
    Interaction as InteractionSchema,
    InteractionListResponse,
    InteractionWithDetails,
)
from app.api.deps import (
    get_current_user,
    get_current_active_user,
    get_current_admin_user,
)

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


@router.get("/admin/list", response_model=InteractionListResponse)
async def admin_list_interactions(
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=500),
    interaction_type: Optional[InteractionType] = Query(None),
    user_id: Optional[str] = Query(None),
    book_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Административный эндпоинт для получения списка взаимодействий.
    """

    skip = (page - 1) * limit
    query = Interaction.find()

    if interaction_type:
        query = query.find(Interaction.interaction_type == interaction_type)
    if user_id:
        query = query.find(Interaction.user_id == user_id)
    if book_id:
        query = query.find(Interaction.book_id == book_id)

    total = await query.count()
    interactions = (
        await query.sort(-Interaction.timestamp).skip(skip).limit(limit).to_list()
    )

    # Загружаем дополнительные данные
    user_ids = {interaction.user_id for interaction in interactions}
    book_ids = {interaction.book_id for interaction in interactions}

    users = await User.find({"_id": {"$in": list(user_ids)}}).to_list() if user_ids else []
    books = await Book.find({"_id": {"$in": list(book_ids)}}).to_list() if book_ids else []

    user_map = {str(user.id): user for user in users}
    book_map = {str(book.id): book for book in books}

    enriched_items: List[InteractionWithDetails] = []
    for interaction in interactions:
        user_data = user_map.get(str(interaction.user_id))
        book_data = book_map.get(str(interaction.book_id))

        enriched_items.append(
            InteractionWithDetails(
                **interaction.model_dump(),
                user_email=getattr(user_data, "email", None),
                user_full_name=getattr(user_data, "full_name", None),
                book_title=getattr(book_data, "title", None),
                book_author=getattr(book_data, "author", None),
            )
        )

    return InteractionListResponse(
        items=enriched_items,
        total_count=total,
        page=page,
        limit=limit,
    )


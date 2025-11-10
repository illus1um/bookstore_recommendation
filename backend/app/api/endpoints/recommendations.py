"""
API endpoints для получения рекомендаций.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.models.book import Book
from app.models.user import User
from app.models.interaction import Interaction, InteractionType
from app.schemas.book import Book as BookSchema
from app.api.deps import get_current_user, get_current_active_user
from app.services.recommendation_engine import RecommendationEngine

router = APIRouter()
recommendation_engine = RecommendationEngine()


@router.get("/for-you", response_model=List[BookSchema])
async def get_personal_recommendations(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_active_user)
):
    """
    Получает персональные рекомендации для текущего пользователя.
    
    Args:
        limit: Количество рекомендаций
        current_user: Текущий пользователь
        
    Returns:
        Список рекомендованных книг
    """
    recommendations = await recommendation_engine.get_personal_recommendations(
        user_id=str(current_user.id),
        limit=limit
    )
    return recommendations


@router.get("/similar/{book_id}", response_model=List[BookSchema])
async def get_similar_books(
    book_id: str,
    limit: int = Query(10, ge=1, le=50)
):
    """
    Получает похожие книги на основе заданной книги.
    
    Args:
        book_id: ID книги
        limit: Количество похожих книг
        
    Returns:
        Список похожих книг
        
    Raises:
        HTTPException: Если книга не найдена
    """
    book = await Book.get(book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Книга не найдена"
        )
    
    similar_books = await recommendation_engine.get_similar_books(
        book_id=book_id,
        limit=limit
    )
    return similar_books


@router.get("/trending", response_model=List[BookSchema])
async def get_trending_books(
    limit: int = Query(10, ge=1, le=50),
    days: int = Query(30, ge=1, le=365)
):
    """
    Получает популярные книги за последние N дней.
    
    Args:
        limit: Количество книг
        days: Количество дней для анализа
        
    Returns:
        Список популярных книг
    """
    trending_books = await recommendation_engine.get_trending_books(
        limit=limit,
        days=days
    )
    return trending_books


@router.get("/by-genre/{genre}", response_model=List[BookSchema])
async def get_recommendations_by_genre(
    genre: str,
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user)
):
    """
    Получает рекомендации по жанру.
    
    Args:
        genre: Жанр для рекомендаций
        limit: Количество книг
        current_user: Текущий пользователь (опционально)
        
    Returns:
        Список книг в указанном жанре
    """
    # Если пользователь авторизован, учитываем его предпочтения
    user_id = str(current_user.id) if current_user else None
    
    recommendations = await recommendation_engine.get_recommendations_by_genre(
        genre=genre,
        limit=limit,
        user_id=user_id
    )
    return recommendations


@router.get("/new", response_model=List[BookSchema])
async def get_new_books(
    limit: int = Query(10, ge=1, le=50),
    user_id: Optional[str] = Query(None),
):
    """
    Получает подборку новинок каталога.
    """

    user = await User.get(user_id) if user_id else None
    new_books = await recommendation_engine.get_new_books(limit=limit, user=user)
    return new_books


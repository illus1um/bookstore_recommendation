"""
API endpoints для работы с книгами.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.models.book import Book
from app.models.interaction import Interaction
from app.schemas.book import (
    Book as BookSchema,
    BookCreate,
    BookUpdate,
    BookSearch
)
from app.api.deps import get_current_user, get_current_admin_user

router = APIRouter()


@router.get("/", response_model=List[BookSchema])
async def get_books(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    genre: Optional[str] = None,
    author: Optional[str] = None,
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    min_rating: Optional[float] = Query(None, ge=0.0, le=5.0)
):
    """
    Получает список книг с пагинацией и фильтрами.
    
    Args:
        skip: Количество пропущенных записей
        limit: Максимальное количество записей
        genre: Фильтр по жанру
        author: Фильтр по автору
        min_price: Минимальная цена
        max_price: Максимальная цена
        min_rating: Минимальный рейтинг
        
    Returns:
        Список книг
    """
    query = {}
    
    if genre:
        query["genre"] = genre
    if author:
        query["author"] = author
    if min_price is not None or max_price is not None:
        price_query = {}
        if min_price is not None:
            price_query["$gte"] = min_price
        if max_price is not None:
            price_query["$lte"] = max_price
        query["price"] = price_query
    if min_rating is not None:
        query["average_rating"] = {"$gte": min_rating}
    
    books = await Book.find(query).skip(skip).limit(limit).to_list()
    return books


@router.get("/{book_id}", response_model=BookSchema)
async def get_book(book_id: str):
    """
    Получает детали книги по ID.
    
    Args:
        book_id: ID книги
        
    Returns:
        Детали книги
        
    Raises:
        HTTPException: Если книга не найдена
    """
    book = await Book.get(book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Книга не найдена"
        )
    return book


@router.post("/", response_model=BookSchema, status_code=status.HTTP_201_CREATED)
async def create_book(
    book_data: BookCreate,
    current_user = Depends(get_current_admin_user)
):
    """
    Создает новую книгу (только для администраторов).
    
    Args:
        book_data: Данные для создания книги
        current_user: Текущий администратор
        
    Returns:
        Созданная книга
    """
    book = Book(**book_data.model_dump())
    await book.insert()
    return book


@router.put("/{book_id}", response_model=BookSchema)
async def update_book(
    book_id: str,
    book_update: BookUpdate,
    current_user = Depends(get_current_admin_user)
):
    """
    Обновляет книгу (только для администраторов).
    
    Args:
        book_id: ID книги
        book_update: Данные для обновления
        current_user: Текущий администратор
        
    Returns:
        Обновленная книга
        
    Raises:
        HTTPException: Если книга не найдена
    """
    book = await Book.get(book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Книга не найдена"
        )
    
    # Обновляем только переданные поля
    update_data = book_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(book, field, value)
    
    await book.save()
    return book


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book(
    book_id: str,
    current_user = Depends(get_current_admin_user)
):
    """
    Удаляет книгу (только для администраторов).
    
    Args:
        book_id: ID книги
        current_user: Текущий администратор
        
    Raises:
        HTTPException: Если книга не найдена
    """
    book = await Book.get(book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Книга не найдена"
        )
    
    await book.delete()
    return None


@router.get("/search", response_model=List[BookSchema])
async def search_books(
    q: str = Query(..., min_length=1),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Поиск книг по названию, автору или жанру.
    
    Args:
        q: Поисковый запрос
        skip: Количество пропущенных записей
        limit: Максимальное количество записей
        
    Returns:
        Список найденных книг
    """
    # Используем текстовый поиск MongoDB
    # Для полноценного поиска лучше использовать Elasticsearch или Atlas Search
    books = await Book.find(
        {
            "$or": [
                {"title": {"$regex": q, "$options": "i"}},
                {"author": {"$regex": q, "$options": "i"}},
                {"genre": {"$regex": q, "$options": "i"}},
                {"description": {"$regex": q, "$options": "i"}}
            ]
        }
    ).skip(skip).limit(limit).to_list()
    
    return books


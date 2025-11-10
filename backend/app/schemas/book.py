"""
Схемы для работы с книгами.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class BookBase(BaseModel):
    """Базовая схема книги."""
    title: str
    author: str
    isbn: Optional[str] = None
    description: str
    genre: str
    publisher: str
    publication_year: int = Field(..., ge=1000, le=9999)
    page_count: int = Field(..., ge=1)
    language: str = Field(default="en", max_length=10)
    cover_image_url: Optional[str] = None
    price: float = Field(..., ge=0)
    stock: int = Field(default=0, ge=0)
    tags: List[str] = Field(default_factory=list)


class BookCreate(BookBase):
    """Схема для создания книги."""
    pass


class BookUpdate(BaseModel):
    """Схема для обновления книги."""
    title: Optional[str] = None
    author: Optional[str] = None
    isbn: Optional[str] = None
    description: Optional[str] = None
    genre: Optional[str] = None
    publisher: Optional[str] = None
    publication_year: Optional[int] = Field(None, ge=1000, le=9999)
    page_count: Optional[int] = Field(None, ge=1)
    language: Optional[str] = Field(None, max_length=10)
    cover_image_url: Optional[str] = None
    price: Optional[float] = Field(None, ge=0)
    stock: Optional[int] = Field(None, ge=0)
    average_rating: Optional[float] = Field(None, ge=0.0, le=5.0)
    tags: Optional[List[str]] = None


class BookInDB(BookBase):
    """Схема книги в БД."""
    id: str
    average_rating: float = Field(default=0.0, ge=0.0, le=5.0)
    created_at: datetime
    
    class Config:
        from_attributes = True


class Book(BookInDB):
    """Схема книги для ответа API."""
    pass


class BookSearch(BaseModel):
    """Схема для поиска книг."""
    query: Optional[str] = None
    genre: Optional[str] = None
    author: Optional[str] = None
    min_price: Optional[float] = Field(None, ge=0)
    max_price: Optional[float] = Field(None, ge=0)
    min_rating: Optional[float] = Field(None, ge=0.0, le=5.0)
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


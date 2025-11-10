"""
Модель книги.
"""
from datetime import datetime
from typing import Optional, List
from beanie import Document, Indexed
from pydantic import Field


class Book(Document):
    """
    Модель книги.
    """
    title: Indexed(str)
    author: Indexed(str)
    isbn: Optional[Indexed(str, unique=True, sparse=True)] = None
    description: str
    genre: Indexed(str)
    publisher: str
    publication_year: int = Field(..., ge=1000, le=9999)
    page_count: int = Field(..., ge=1)
    language: str = Field(default="en", max_length=10)
    cover_image_url: Optional[str] = None
    price: float = Field(..., ge=0)
    stock: int = Field(default=0, ge=0)
    average_rating: float = Field(default=0.0, ge=0.0, le=5.0)
    tags: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "books"
        indexes = [
            [("title", 1)],
            [("author", 1)],
            [("genre", 1)],
            [("isbn", 1)],
        ]


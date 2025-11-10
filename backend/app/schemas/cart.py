"""
Pydantic-схемы для работы с корзиной.
"""
from datetime import datetime
from typing import List

from pydantic import BaseModel, Field, field_validator

from app.schemas.book import Book


class CartItemRequest(BaseModel):
    """Запрос на добавление книги в корзину."""

    book_id: str
    quantity: int = Field(..., ge=1)


class CartUpdateRequest(BaseModel):
    """Запрос на обновление количества книги в корзине."""

    quantity: int = Field(..., ge=0)


class CartItemResponse(BaseModel):
    """Элемент корзины с полной информацией о книге."""

    book_id: str
    quantity: int
    added_at: datetime
    book: Book
    subtotal: float

    @field_validator("book_id", mode="before")
    @classmethod
    def convert_id(cls, value):
        return str(value)


class CartResponse(BaseModel):
    """Ответ API с содержимым корзины."""

    items: List[CartItemResponse]
    total_items: int
    total_price: float


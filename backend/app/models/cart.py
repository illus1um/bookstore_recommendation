"""
Модель корзины.
"""
from datetime import datetime
from typing import List

from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, Field


class CartItem(BaseModel):
    """Позиция в корзине."""

    book_id: PydanticObjectId
    quantity: int = Field(..., ge=1)
    added_at: datetime = Field(default_factory=datetime.utcnow)


class Cart(Document):
    """Документ корзины пользователя."""

    user_id: Indexed(PydanticObjectId, unique=True)
    items: List[CartItem] = Field(default_factory=list)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "carts"
        indexes = [
            [("user_id", 1)],
        ]



"""
Модель взаимодействия пользователя с книгой.
"""
from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum
from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field, BaseModel, ConfigDict


class InteractionType(str, Enum):
    """Типы взаимодействий."""
    VIEW = "view"
    LIKE = "like"
    ADD_TO_CART = "add_to_cart"
    REMOVE_FROM_CART = "remove_from_cart"
    PURCHASE = "purchase"
    REVIEW = "review"


class InteractionMetadata(BaseModel):
    """Метаданные взаимодействия."""

    model_config = ConfigDict(extra="allow")

    duration: Optional[int] = Field(None, ge=0, description="Время просмотра в секундах")
    quantity: Optional[int] = Field(
        None, ge=0, description="Количество (для корзины/покупки)"
    )
    price_at_purchase: Optional[float] = Field(
        None, ge=0, description="Цена на момент покупки"
    )
    rating: Optional[float] = Field(
        None, ge=0, le=5, description="Оценка пользователя (1-5)"
    )
    review_text: Optional[str] = Field(
        None, description="Текст отзыва пользователя"
    )
    extra: Dict[str, Any] = Field(
        default_factory=dict, description="Дополнительные произвольные данные"
    )


class Interaction(Document):
    """
    Модель взаимодействия пользователя с книгой.
    """
    user_id: Indexed(PydanticObjectId)
    book_id: Indexed(PydanticObjectId)
    interaction_type: InteractionType
    timestamp: Indexed(datetime) = Field(default_factory=datetime.utcnow)
    metadata: InteractionMetadata = Field(default_factory=InteractionMetadata)

    class Settings:
        name = "interactions"
        indexes = [
            [("user_id", 1)],
            [("book_id", 1)],
            [("timestamp", -1)],
            [("user_id", 1), ("book_id", 1)],
            [("user_id", 1), ("book_id", 1), ("interaction_type", 1)],
        ]


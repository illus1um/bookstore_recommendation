"""
Модель взаимодействия пользователя с книгой.
"""
from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum
from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field


class InteractionType(str, Enum):
    """Типы взаимодействий."""
    VIEW = "view"
    LIKE = "like"
    CART = "cart"
    PURCHASE = "purchase"
    REVIEW = "review"


class Interaction(Document):
    """
    Модель взаимодействия пользователя с книгой.
    """
    user_id: Indexed(PydanticObjectId)
    book_id: Indexed(PydanticObjectId)
    interaction_type: InteractionType
    timestamp: Indexed(datetime) = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    class Settings:
        name = "interactions"
        indexes = [
            [("user_id", 1)],
            [("book_id", 1)],
            [("timestamp", 1)],
            [("user_id", 1), ("book_id", 1)],
        ]


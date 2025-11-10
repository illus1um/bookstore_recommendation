"""
Схемы для работы с взаимодействиями.
"""
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator
from app.models.interaction import InteractionType


class InteractionBase(BaseModel):
    """Базовая схема взаимодействия."""
    book_id: str
    interaction_type: InteractionType
    metadata: Dict[str, Any] = Field(default_factory=dict)


class InteractionCreate(InteractionBase):
    """Схема для создания взаимодействия."""
    pass


class InteractionInDB(InteractionBase):
    """Схема взаимодействия в БД."""
    id: str
    user_id: str
    timestamp: datetime
    
    class Config:
        from_attributes = True

    @field_validator("id", "user_id", "book_id", mode="before")
    @classmethod
    def convert_ids(cls, value):
        return str(value)


class Interaction(InteractionInDB):
    """Схема взаимодействия для ответа API."""
    pass


class InteractionStats(BaseModel):
    """Статистика взаимодействий."""
    total_views: int = 0
    total_likes: int = 0
    total_carts: int = 0
    total_purchases: int = 0
    total_reviews: int = 0
    average_rating: Optional[float] = None


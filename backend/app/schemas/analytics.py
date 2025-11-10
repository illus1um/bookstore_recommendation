"""
Схемы для аналитики пользовательского поведения.
"""
from typing import List

from pydantic import BaseModel, Field


class UserBehaviorAnalytics(BaseModel):
    """Сводная статистика по поведению пользователя."""

    favorite_genres: List[str] = Field(default_factory=list)
    favorite_authors: List[str] = Field(default_factory=list)
    total_orders: int = 0
    total_spent: float = 0.0
    average_order_value: float = 0.0
    purchase_frequency_per_month: float = 0.0


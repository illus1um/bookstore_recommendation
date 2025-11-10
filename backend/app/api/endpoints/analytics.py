"""
Аналитические эндпоинты.
"""
from collections import Counter
from datetime import datetime
from typing import Iterable

from fastapi import APIRouter, Depends

from app.api.deps import get_current_active_user
from app.models.book import Book
from app.models.interaction import Interaction, InteractionType
from app.models.order import Order
from app.models.user import User
from app.schemas.analytics import UserBehaviorAnalytics

router = APIRouter()


def _extract_metadata_value(metadata, field: str, default=0):
    """Безопасно извлекает значение из метаданных взаимодействия."""

    if metadata is None:
        return default
    value = getattr(metadata, field, default)
    if value is None and isinstance(metadata, dict):
        return metadata.get(field, default)
    return value or default


@router.get("/user-behavior", response_model=UserBehaviorAnalytics)
async def get_user_behavior_analytics(
    current_user: User = Depends(get_current_active_user),
):
    """Возвращает агрегированную статистику поведения текущего пользователя."""

    interactions = await Interaction.find(
        {
            "user_id": current_user.id,
            "interaction_type": {
                "$in": [
                    InteractionType.LIKE.value,
                    InteractionType.PURCHASE.value,
                    InteractionType.ADD_TO_CART.value,
                    InteractionType.VIEW.value,
                    InteractionType.REVIEW.value,
                ]
            },
        }
    ).to_list()

    book_ids = {interaction.book_id for interaction in interactions}
    books = await Book.find({"_id": {"$in": list(book_ids)}}).to_list()
    book_map = {book.id: book for book in books}

    genre_counter: Counter = Counter()
    author_counter: Counter = Counter()

    for interaction in interactions:
        book = book_map.get(interaction.book_id)
        if not book:
            continue

        weight = 1.0
        if interaction.interaction_type == InteractionType.PURCHASE:
            weight = max(_extract_metadata_value(interaction.metadata, "quantity", 1), 1)
        elif interaction.interaction_type == InteractionType.LIKE:
            weight = 1.5
        elif interaction.interaction_type == InteractionType.ADD_TO_CART:
            weight = _extract_metadata_value(interaction.metadata, "quantity", 1)
        elif interaction.interaction_type == InteractionType.VIEW:
            duration = _extract_metadata_value(interaction.metadata, "duration", 0)
            weight = max(min(duration / 120.0, 1.0), 0.2)
        elif interaction.interaction_type == InteractionType.REVIEW:
            rating = _extract_metadata_value(interaction.metadata, "rating", 0)
            weight = max(float(rating), 1.0)

        genre_counter[book.genre] += weight
        author_counter[book.author] += weight

    favorite_genres = [genre for genre, _ in genre_counter.most_common(5)]
    favorite_authors = [author for author, _ in author_counter.most_common(5)]

    orders = await Order.find(Order.user_id == current_user.id).to_list()
    total_orders = len(orders)
    total_spent = round(sum(order.total_amount for order in orders), 2)
    average_order_value = round(total_spent / total_orders, 2) if total_orders else 0.0

    if total_orders:
        first_order_date = min(order.created_at for order in orders)
        months_active = max((datetime.utcnow() - first_order_date).days / 30.0, 1 / 30.0)
        purchase_frequency = total_orders / months_active
    else:
        purchase_frequency = 0.0

    return UserBehaviorAnalytics(
        favorite_genres=favorite_genres,
        favorite_authors=favorite_authors,
        total_orders=total_orders,
        total_spent=total_spent,
        average_order_value=average_order_value,
        purchase_frequency_per_month=round(purchase_frequency, 2),
    )


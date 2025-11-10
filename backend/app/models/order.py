"""
Модель заказа.
"""
from datetime import datetime
from enum import Enum
from typing import List

from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, Field


class OrderStatus(str, Enum):
    """Статусы заказа."""

    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class OrderItem(BaseModel):
    """Элемент заказа."""

    book_id: PydanticObjectId
    quantity: int = Field(..., ge=1)
    price_at_purchase: float = Field(..., ge=0)
    title: str
    author: str


class ShippingAddress(BaseModel):
    """Адрес доставки."""

    address: str
    city: str
    postal_code: str
    country: str


class Order(Document):
    """Документ заказа."""

    user_id: Indexed(PydanticObjectId)
    items: List[OrderItem] = Field(default_factory=list)
    total_amount: float = Field(..., ge=0)
    status: OrderStatus = Field(default=OrderStatus.PENDING)
    shipping_address: ShippingAddress
    payment_method: str = Field(default="card")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "orders"
        indexes = [
            [("user_id", 1)],
            [("status", 1)],
            [("created_at", -1)],
        ]



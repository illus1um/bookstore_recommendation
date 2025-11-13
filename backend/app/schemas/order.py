"""
Pydantic-схемы для заказов.
"""
from datetime import datetime
from typing import List

from pydantic import BaseModel, Field, field_validator

from app.models.order import OrderStatus


class ShippingAddressSchema(BaseModel):
    """Адрес доставки."""

    address: str
    city: str
    postal_code: str
    country: str


class OrderCreateRequest(BaseModel):
    """Запрос на создание заказа."""

    shipping_address: ShippingAddressSchema
    payment_method: str = Field(default="card", description="Способ оплаты: card или cash")


class OrderItemResponse(BaseModel):
    """Элемент заказа с краткой информацией о книге."""

    book_id: str
    title: str
    author: str
    quantity: int
    price_at_purchase: float

    @field_validator("book_id", mode="before")
    @classmethod
    def convert_id(cls, value):
        return str(value)


class OrderResponse(BaseModel):
    """Ответ API по заказу."""

    id: str
    user_id: str
    items: List[OrderItemResponse]
    total_amount: float
    status: OrderStatus
    shipping_address: ShippingAddressSchema
    payment_method: str = "card"
    created_at: datetime
    updated_at: datetime

    @field_validator("id", "user_id", mode="before")
    @classmethod
    def convert_ids(cls, value):
        return str(value)


class OrderListResponse(BaseModel):
    """Список заказов с пагинацией."""

    items: List[OrderResponse]
    total_count: int
    page: int
    limit: int


class OrderStatusUpdateRequest(BaseModel):
    """Запрос на изменение статуса заказа."""

    status: OrderStatus

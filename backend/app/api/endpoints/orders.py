"""
Эндпоинты для работы с заказами.
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

from app.api.deps import get_current_active_user, get_current_admin_user
from app.models.book import Book
from app.models.cart import Cart
from app.models.interaction import Interaction, InteractionType
from app.models.order import Order, OrderItem, OrderStatus, ShippingAddress
from app.models.user import User
from app.schemas.order import (
    OrderCreateRequest,
    OrderListResponse,
    OrderResponse,
    OrderItemResponse,
    ShippingAddressSchema,
    OrderStatusUpdateRequest,
)

router = APIRouter()

IMMUTABLE_STATUSES = {OrderStatus.CANCELLED, OrderStatus.DELIVERED}


def _order_to_response(order: Order) -> OrderResponse:
    """Преобразует документ заказа в Pydantic-схему."""

    return OrderResponse(
        id=str(order.id),
        user_id=str(order.user_id),
        items=[
            OrderItemResponse(
                book_id=str(item.book_id),
                title=item.title,
                author=item.author,
                quantity=item.quantity,
                price_at_purchase=item.price_at_purchase,
            )
            for item in order.items
        ],
        total_amount=order.total_amount,
        status=order.status,
        shipping_address=ShippingAddressSchema(
            address=order.shipping_address.address,
            city=order.shipping_address.city,
            postal_code=order.shipping_address.postal_code,
            country=order.shipping_address.country,
        ),
        payment_method=order.payment_method,
        created_at=order.created_at,
        updated_at=order.updated_at,
    )


async def _log_purchase_interaction(user_id, item: OrderItem) -> None:
    """Фиксирует факт покупки в коллекции взаимодействий."""

    await Interaction(
        user_id=user_id,
        book_id=item.book_id,
        interaction_type=InteractionType.PURCHASE,
        metadata={
            "quantity": item.quantity,
            "price_at_purchase": item.price_at_purchase,
        },
    ).insert()


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreateRequest, current_user: User = Depends(get_current_active_user)
):
    """Создаёт заказ на основе текущей корзины пользователя."""
    
    print(f"Получен запрос на создание заказа от пользователя {current_user.id}")
    print(f"Payload: {payload}")

    cart = await Cart.find_one(Cart.user_id == current_user.id)
    if not cart or not cart.items:
        print(f"Корзина пользователя {current_user.id} пуста")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="В корзине нет товаров",
        )

    book_ids = [item.book_id for item in cart.items]
    books = await Book.find({"_id": {"$in": book_ids}}).to_list()
    book_map = {book.id: book for book in books}

    order_items: list[OrderItem] = []
    total_amount = 0.0

    for item in cart.items:
        book = book_map.get(item.book_id)
        if not book:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Некоторые книги недоступны",
            )
        if book.stock < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Недостаточно экземпляров книги '{book.title}'",
            )
        price = book.price
        total_amount += price * item.quantity

        order_items.append(
            OrderItem(
                book_id=book.id,
                quantity=item.quantity,
                price_at_purchase=price,
                title=book.title,
                author=book.author,
            )
        )

    if not order_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Не удалось сформировать заказ",
        )

    now = datetime.utcnow()
    order = Order(
        user_id=current_user.id,
        items=order_items,
        total_amount=round(total_amount, 2),
        status=OrderStatus.PENDING,
        shipping_address=ShippingAddress(**payload.shipping_address.model_dump()),
        payment_method=payload.payment_method,
        created_at=now,
        updated_at=now,
    )
    await order.insert()

    # Списываем остатки и логируем взаимодействия
    for item in order_items:
        book = book_map[item.book_id]
        book.stock = max(book.stock - item.quantity, 0)
        await book.save()
        await _log_purchase_interaction(current_user.id, item)

    # Очищаем корзину
    cart.items = []
    cart.updated_at = now
    await cart.save()

    return _order_to_response(order)


@router.get("/", response_model=OrderListResponse)
async def list_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
):
    """Возвращает заказы текущего пользователя."""

    skip = (page - 1) * limit
    query = Order.find(Order.user_id == current_user.id).sort(-Order.created_at)

    items = await query.skip(skip).limit(limit).to_list()
    total = await Order.find(Order.user_id == current_user.id).count()

    return OrderListResponse(
        items=[_order_to_response(order) for order in items],
        total_count=total,
        page=page,
        limit=limit,
    )


@router.get("/admin", response_model=OrderListResponse)
async def admin_list_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    status_filter: Optional[OrderStatus] = Query(
        None, alias="status", description="Фильтр по статусу заказа"
    ),
    current_admin: User = Depends(get_current_admin_user),
):
    """Возвращает заказы для администраторов с возможностью фильтрации по статусу."""

    skip = (page - 1) * limit
    query = Order.find()

    if status_filter:
        query = query.find(Order.status == status_filter)

    total = await query.count()
    items = (
        await query.sort(-Order.created_at)
        .skip(skip)
        .limit(limit)
        .to_list()
    )

    return OrderListResponse(
        items=[_order_to_response(order) for order in items],
        total_count=total,
        page=page,
        limit=limit,
    )


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str, current_user: User = Depends(get_current_active_user)
):
    """Возвращает конкретный заказ пользователя."""

    order = await Order.get(order_id)
    if not order or str(order.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Заказ не найден")
    return _order_to_response(order)


@router.put("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: str, current_user: User = Depends(get_current_active_user)
):
    """Отменяет заказ, если он ещё не подтверждён."""

    order = await Order.get(order_id)
    if not order or str(order.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Заказ не найден")

    if order.status != OrderStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Заказ уже обработан и не может быть отменён",
        )

    # Возвращаем остатки
    for item in order.items:
        book = await Book.get(item.book_id)
        if book:
            book.stock += item.quantity
            await book.save()

    order.status = OrderStatus.CANCELLED
    order.updated_at = datetime.utcnow()
    await order.save()

    return _order_to_response(order)


@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: str,
    payload: OrderStatusUpdateRequest,
    current_admin: User = Depends(get_current_admin_user),
):
    """Изменяет статус заказа (для администраторов)."""

    order = await Order.get(order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Заказ не найден")

    if order.status == payload.status:
        return _order_to_response(order)

    if order.status in IMMUTABLE_STATUSES and payload.status != order.status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Статус завершённого или отменённого заказа изменить нельзя",
        )

    order.status = payload.status
    order.updated_at = datetime.utcnow()
    await order.save()

    return _order_to_response(order)

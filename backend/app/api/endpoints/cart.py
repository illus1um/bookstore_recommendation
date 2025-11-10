"""
Эндпоинты для работы с корзиной пользователя.
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Path, status

from app.api.deps import get_current_active_user
from app.models.book import Book
from app.models.cart import Cart, CartItem
from app.models.interaction import Interaction, InteractionType
from app.models.user import User
from app.schemas.cart import (
    CartItemRequest,
    CartResponse,
    CartUpdateRequest,
    CartItemResponse,
)

router = APIRouter()


async def _get_or_create_cart(user_id) -> tuple[Cart, bool]:
    """Возвращает корзину пользователя или создаёт новую."""

    cart = await Cart.find_one(Cart.user_id == user_id)
    is_new = False
    if not cart:
        cart = Cart(user_id=user_id, items=[])
        is_new = True
    return cart, is_new


async def _serialize_cart(cart: Optional[Cart]) -> CartResponse:
    """Преобразует документ корзины в ответ API."""

    if cart is None or not cart.items:
        return CartResponse(items=[], total_items=0, total_price=0.0)

    book_ids = [item.book_id for item in cart.items]
    books = await Book.find({"_id": {"$in": book_ids}}).to_list()
    book_map = {book.id: book for book in books}

    items: list[CartItemResponse] = []
    total_price = 0.0
    total_items = 0

    for item in cart.items:
        book = book_map.get(item.book_id)
        if not book:
            continue

        subtotal = round(book.price * item.quantity, 2)
        total_price += subtotal
        total_items += item.quantity

        items.append(
            CartItemResponse(
                book_id=str(item.book_id),
                quantity=item.quantity,
                added_at=item.added_at,
                book=book,
                subtotal=subtotal,
            )
        )

    return CartResponse(
        items=items, total_items=total_items, total_price=round(total_price, 2)
    )


async def _create_interaction(
    user_id, book_id, interaction_type: InteractionType, metadata: dict
) -> None:
    """Создаёт запись о взаимодействии."""

    interaction = Interaction(
        user_id=user_id,
        book_id=book_id,
        interaction_type=interaction_type,
        metadata=metadata,
    )
    await interaction.insert()


@router.get("/", response_model=CartResponse)
async def get_cart(current_user: User = Depends(get_current_active_user)):
    """Возвращает содержимое корзины текущего пользователя."""

    cart = await Cart.find_one(Cart.user_id == current_user.id)
    return await _serialize_cart(cart)


@router.post("/add", response_model=CartResponse, status_code=status.HTTP_200_OK)
async def add_to_cart(
    payload: CartItemRequest, current_user: User = Depends(get_current_active_user)
):
    """Добавляет книгу в корзину пользователя."""

    book = await Book.get(payload.book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Книга не найдена"
        )

    cart, is_new = await _get_or_create_cart(current_user.id)
    now = datetime.utcnow()

    for item in cart.items:
        if item.book_id == book.id:
            item.quantity += payload.quantity
            item.added_at = now
            break
    else:
        cart.items.append(CartItem(book_id=book.id, quantity=payload.quantity, added_at=now))

    cart.updated_at = now

    if is_new:
        await cart.insert()
    else:
        await cart.save()

    await _create_interaction(
        user_id=current_user.id,
        book_id=book.id,
        interaction_type=InteractionType.ADD_TO_CART,
        metadata={"quantity": payload.quantity},
    )

    return await _serialize_cart(cart)


@router.put(
    "/update/{book_id}",
    response_model=CartResponse,
    status_code=status.HTTP_200_OK,
)
async def update_cart_item(
    payload: CartUpdateRequest,
    book_id: str = Path(...),
    current_user: User = Depends(get_current_active_user),
):
    """Обновляет количество конкретной книги в корзине."""

    cart, is_new = await _get_or_create_cart(current_user.id)

    if not cart.items:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Корзина пуста"
        )

    target_item = None
    for item in cart.items:
        if str(item.book_id) == book_id:
            target_item = item
            break

    if target_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Товар в корзине не найден"
        )

    now = datetime.utcnow()

    if payload.quantity <= 0:
        cart.items.remove(target_item)
        await _create_interaction(
            user_id=current_user.id,
            book_id=target_item.book_id,
            interaction_type=InteractionType.REMOVE_FROM_CART,
            metadata={"quantity": 0},
        )
    else:
        delta = payload.quantity - target_item.quantity
        target_item.quantity = payload.quantity
        target_item.added_at = now
        if delta > 0:
            await _create_interaction(
                user_id=current_user.id,
                book_id=target_item.book_id,
                interaction_type=InteractionType.ADD_TO_CART,
                metadata={"quantity": delta},
            )

    cart.updated_at = now

    if not cart.items:
        await cart.save()
    else:
        if is_new:
            await cart.insert()
        else:
            await cart.save()

    cart = await Cart.find_one(Cart.user_id == current_user.id)
    return await _serialize_cart(cart)


@router.delete(
    "/{book_id}",
    response_model=CartResponse,
    status_code=status.HTTP_200_OK,
)
async def remove_cart_item(
    book_id: str, current_user: User = Depends(get_current_active_user)
):
    """Удаляет книгу из корзины."""

    cart = await Cart.find_one(Cart.user_id == current_user.id)
    if not cart or not cart.items:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Корзина пуста"
        )

    removed = False
    for item in list(cart.items):
        if str(item.book_id) == book_id:
            cart.items.remove(item)
            removed = True
            await _create_interaction(
                user_id=current_user.id,
                book_id=item.book_id,
                interaction_type=InteractionType.REMOVE_FROM_CART,
                metadata={"quantity": 0},
            )
            break

    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Товар в корзине не найден"
        )

    cart.updated_at = datetime.utcnow()
    await cart.save()
    return await _serialize_cart(cart)


@router.delete("/clear", response_model=CartResponse, status_code=status.HTTP_200_OK)
async def clear_cart(current_user: User = Depends(get_current_active_user)):
    """Очищает корзину пользователя."""

    cart = await Cart.find_one(Cart.user_id == current_user.id)
    if not cart or not cart.items:
        return CartResponse(items=[], total_items=0, total_price=0.0)

    for item in cart.items:
        await _create_interaction(
            user_id=current_user.id,
            book_id=item.book_id,
            interaction_type=InteractionType.REMOVE_FROM_CART,
            metadata={"quantity": 0},
        )

    cart.items = []
    cart.updated_at = datetime.utcnow()
    await cart.save()
    return await _serialize_cart(cart)


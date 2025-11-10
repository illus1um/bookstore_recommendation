import { Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react'
import Button from '../common/Button'
import Loading from '../common/Loading'
import ErrorMessage from '../common/ErrorMessage'
import { useCart } from '../../hooks/useCart'
import useUIStore from '../../store/uiStore'
import { formatPrice } from '../../utils/helpers'

const CartDrawer = () => {
  const navigate = useNavigate()
  const { isCartOpen, closeCart } = useUIStore()
  const { cart, isLoading, updateItem, removeItem, clearCart, refreshCart } = useCart()

  const handleDecrease = (item) => {
    const nextQuantity = item.quantity - 1
    if (nextQuantity <= 0) {
      removeItem(item.book_id)
    } else {
      updateItem({ bookId: item.book_id, quantity: nextQuantity })
    }
  }

  const handleIncrease = (item) => {
    updateItem({ bookId: item.book_id, quantity: item.quantity + 1 })
  }

  const handleCheckout = () => {
    closeCart()
    navigate('/checkout')
  }

  if (!isCartOpen) {
    return null
  }

  const items = cart?.items ?? []
  const totalItems = cart?.total_items ?? 0
  const totalPrice = cart?.total_price ?? 0

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="flex-1 bg-black/40 backdrop-blur-sm"
        onClick={closeCart}
        role="presentation"
      />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Корзина</h2>
            <p className="text-sm text-neutral-500">
              {totalItems > 0 ? `${totalItems} товаров` : 'Пока пусто'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => clearCart()}
                className="text-sm text-neutral-500 transition hover:text-primary"
              >
                Очистить
              </button>
            )}
            <button
              type="button"
              className="rounded-full border border-neutral-200 p-2 text-neutral-500 hover:bg-neutral-100"
              onClick={closeCart}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <Loading message="Загружаем корзину..." className="mt-12" />
          ) : !cart ? (
            <ErrorMessage
              description="Не удалось загрузить корзину."
              action={
                <Button variant="secondary" size="sm" onClick={refreshCart}>
                  Повторить попытку
                </Button>
              }
            />
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100">
                <ShoppingBag className="h-10 w-10 text-neutral-400" />
              </div>
              <p className="mb-2 text-sm font-medium text-neutral-700">Корзина пуста</p>
              <p className="mb-4 text-xs text-neutral-500">
                Загляните в каталог и добавьте что-нибудь интересное!
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  closeCart()
                  navigate('/catalog')
                }}
              >
                Перейти в каталог
              </Button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.book_id}
                  className="flex gap-4 rounded-2xl border border-neutral-100 p-4 shadow-sm transition hover:border-primary/40"
                >
                  <img
                    src={item.book.cover_image_url}
                    alt={item.book.title}
                    className="h-24 w-16 flex-none rounded-lg object-cover"
                  />
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-900">
                        {item.book.title}
                      </h3>
                      <p className="text-xs text-neutral-500">{item.book.author}</p>
                      <p className="mt-2 text-sm font-medium text-primary">
                        {formatPrice(item.book.price)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 rounded-full border border-neutral-200 px-3 py-1">
                        <button
                          type="button"
                          className="p-1 text-neutral-500 hover:text-primary"
                          onClick={() => handleDecrease(item)}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-medium text-neutral-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="p-1 text-neutral-500 hover:text-primary"
                          onClick={() => handleIncrease(item)}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-neutral-900">
                          {formatPrice(item.subtotal)}
                        </span>
                        <button
                          type="button"
                          className="rounded-full border border-neutral-200 p-2 text-neutral-500 hover:bg-neutral-100"
                          onClick={() => removeItem(item.book_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="border-t border-neutral-200 px-6 py-4">
          <div className="mb-3 flex items-center justify-between text-sm text-neutral-600">
            <span>Сумма</span>
            <span className="text-lg font-semibold text-neutral-900">
              {formatPrice(totalPrice)}
            </span>
          </div>
          <Button
            className="w-full"
            size="lg"
            disabled={!items.length}
            onClick={handleCheckout}
          >
            Оформить заказ
          </Button>
        </footer>
      </aside>
    </div>
  )
}

export default CartDrawer


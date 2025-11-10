import { Minus, Plus, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button'
import Loading from '../components/common/Loading'
import { useCart } from '../hooks/useCart'
import { formatPrice } from '../utils/helpers'

const CartPage = () => {
  const navigate = useNavigate()
  const { cart, isLoading, updateItem, removeItem, clearCart } = useCart()

  if (isLoading) {
    return <Loading message="Загружаем корзину..." />
  }

  const items = cart?.items ?? []
  const totalPrice = cart?.total_price ?? 0

  if (!items.length) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto max-w-lg rounded-3xl border border-dashed border-neutral-200 bg-white p-12 shadow-card">
          <h1 className="text-2xl font-semibold text-neutral-900">Корзина пуста</h1>
          <p className="mt-3 text-sm text-neutral-500">
            Перейдите в каталог и добавьте книги, которые хотите приобрести.
          </p>
          <Button className="mt-6" onClick={() => navigate('/catalog')}>
            Перейти в каталог
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-neutral-900">Корзина</h1>
            <button
              type="button"
              onClick={() => clearCart()}
              className="text-sm text-neutral-500 transition hover:text-primary"
            >
              Очистить корзину
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.book_id}
                className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-card md:flex-row md:items-center md:justify-between"
              >
                <div className="flex gap-4">
                  <img
                    src={item.book.cover_image_url}
                    alt={item.book.title}
                    className="h-28 w-20 flex-none rounded-xl object-cover"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900">{item.book.title}</h3>
                    <p className="text-sm text-neutral-500">{item.book.author}</p>
                    <p className="mt-2 text-sm text-neutral-500">{item.book.genre}</p>
                    <p className="mt-2 text-sm font-semibold text-neutral-900">
                      {formatPrice(item.book.price)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-3 md:flex-row md:items-center">
                  <div className="flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1">
                    <button
                      type="button"
                      className="p-1 text-neutral-500 hover:text-primary"
                      onClick={() =>
                        item.quantity > 1
                          ? updateItem({ bookId: item.book_id, quantity: item.quantity - 1 })
                          : removeItem(item.book_id)
                      }
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold text-neutral-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="p-1 text-neutral-500 hover:text-primary"
                      onClick={() =>
                        updateItem({ bookId: item.book_id, quantity: item.quantity + 1 })
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
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
            ))}
          </div>
        </section>

        <aside className="h-fit rounded-3xl bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold text-neutral-900">Итого</h2>
          <div className="mt-4 space-y-2 text-sm text-neutral-600">
            <div className="flex justify-between">
              <span>Товары</span>
              <span>{items.length}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-neutral-900">
              <span>Сумма</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
          </div>
          <Button className="mt-6 w-full" size="lg" onClick={() => navigate('/checkout')}>
            Оформить заказ
          </Button>
        </aside>
      </div>
    </div>
  )
}

export default CartPage


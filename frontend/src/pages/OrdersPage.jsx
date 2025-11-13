import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Calendar, MapPin, CreditCard, ArrowLeft, Filter } from 'lucide-react'
import Button from '../components/common/Button'
import Loading from '../components/common/Loading'
import ErrorMessage from '../components/common/ErrorMessage'
import { useOrders } from '../hooks/useOrders'
import { formatDate, formatPrice } from '../utils/helpers'

const ORDER_STATUS_META = {
  pending: { label: 'В обработке', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  confirmed: { label: 'Подтверждён', badge: 'bg-blue-100 text-blue-700 border-blue-200' },
  shipped: { label: 'Отправлен', badge: 'bg-purple-100 text-purple-700 border-purple-200' },
  delivered: { label: 'Доставлен', badge: 'bg-green-100 text-green-700 border-green-200' },
  cancelled: { label: 'Отменён', badge: 'bg-neutral-200 text-neutral-600 border-neutral-300' },
}

const OrdersPage = () => {
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: orders, isLoading, isError, refetch } = useOrders()

  const filteredOrders = orders?.filter((order) => {
    if (statusFilter === 'all') return true
    return order.status === statusFilter
  }) || []

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Loading message="Загружаем ваши заказы..." />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-12">
        <ErrorMessage
          description="Не удалось загрузить заказы."
          action={
            <Button size="sm" variant="secondary" onClick={() => refetch()}>
              Повторить попытку
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="mb-8">
        <Link
          to="/profile"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-primary transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад в профиль
        </Link>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Мои заказы</h1>
            <p className="mt-2 text-sm text-neutral-500">
              История всех ваших покупок и заказов
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-neutral-200 bg-white pl-10 pr-4 py-2 text-sm font-medium text-neutral-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">Все статусы</option>
                {Object.entries(ORDER_STATUS_META).map(([value, meta]) => (
                  <option key={value} value={value}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-neutral-200 bg-gradient-to-br from-white to-neutral-50/50 p-12 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
            <Package className="h-8 w-8 text-neutral-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-neutral-900">
            {statusFilter === 'all' ? 'У вас пока нет заказов' : 'Заказы с таким статусом не найдены'}
          </h3>
          <p className="mt-2 text-sm text-neutral-500">
            {statusFilter === 'all'
              ? 'Начните с просмотра каталога и добавьте книги в корзину!'
              : 'Попробуйте выбрать другой статус или посмотрите все заказы.'}
          </p>
          {statusFilter === 'all' && (
            <Button as={Link} to="/catalog" className="mt-6">
              Перейти в каталог
            </Button>
          )}
          {statusFilter !== 'all' && (
            <Button variant="secondary" onClick={() => setStatusFilter('all')} className="mt-6">
              Показать все заказы
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusMeta = ORDER_STATUS_META[order.status] || ORDER_STATUS_META.pending
            return (
              <div
                key={order.id}
                className="group overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm transition-all hover:border-primary/20 hover:shadow-md"
              >
                <div className="p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-neutral-900">
                            Заказ #{order.id.slice(0, 8)}
                          </h3>
                          <div className="mt-1 flex items-center gap-2 text-sm text-neutral-500">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(order.created_at)}</span>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.badge}`}
                        >
                          {statusMeta.label}
                        </span>
                      </div>

                      {order.items && order.items.length > 0 && (
                        <div className="space-y-3 rounded-xl border border-neutral-100 bg-neutral-50/50 p-4">
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-3 last:border-0 last:pb-0"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-neutral-900 line-clamp-1">
                                  {item.title}
                                </p>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                                  <span>{item.author}</span>
                                  <span>•</span>
                                  <span>{item.quantity} шт.</span>
                                  <span>•</span>
                                  <span className="font-medium text-neutral-700">
                                    {formatPrice(item.price_at_purchase)} за шт.
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-neutral-900">
                                  {formatPrice(item.price_at_purchase * item.quantity)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid gap-3 sm:grid-cols-2">
                        {order.shipping_address && (
                          <div className="flex items-start gap-2 rounded-lg border border-neutral-100 bg-white p-3">
                            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-neutral-500">Адрес доставки</p>
                              <p className="mt-0.5 text-sm text-neutral-700 line-clamp-3">
                                {typeof order.shipping_address === 'string'
                                  ? order.shipping_address
                                  : `${order.shipping_address.address || ''}, ${order.shipping_address.city || ''}, ${order.shipping_address.postal_code || ''}, ${order.shipping_address.country || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ', ')}
                              </p>
                            </div>
                          </div>
                        )}
                        {order.payment_method && (
                          <div className="flex items-start gap-2 rounded-lg border border-neutral-100 bg-white p-3">
                            <CreditCard className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-neutral-500">Способ оплаты</p>
                              <p className="mt-0.5 text-sm font-medium text-neutral-700">
                                {order.payment_method === 'card' ? 'Банковская карта' : order.payment_method}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 lg:min-w-[180px]">
                      <div className="text-right">
                        <p className="text-xs font-medium text-neutral-500">Итого</p>
                        <p className="mt-1 text-2xl font-bold text-neutral-900">
                          {formatPrice(order.total_amount)}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {order.items?.length || 0}{' '}
                          {order.items?.length === 1
                            ? 'товар'
                            : order.items?.length < 5
                            ? 'товара'
                            : 'товаров'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default OrdersPage


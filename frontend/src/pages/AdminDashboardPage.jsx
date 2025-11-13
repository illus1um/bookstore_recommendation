import { useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import BookForm from '../components/admin/BookForm'
import BookTable from '../components/admin/BookTable'
import BookEditModal from '../components/admin/BookEditModal'
import AdminUsersTab from '../components/admin/AdminUsersTab'
import AdminInteractionsTab from '../components/admin/AdminInteractionsTab'
import Loading from '../components/common/Loading'
import ErrorMessage from '../components/common/ErrorMessage'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import { useBookList, useBookMutations } from '../hooks/useBooks'
import { useAdminOrders, useUpdateOrderStatus } from '../hooks/useOrders'
import { formatDate, formatPrice } from '../utils/helpers'

const SORT_OPTIONS = [
  { value: 'created_desc', label: 'Сначала новые' },
  { value: 'created_asc', label: 'Сначала старые' },
  { value: 'title_asc', label: 'Название A-Z' },
  { value: 'title_desc', label: 'Название Z-A' },
  { value: 'price_desc', label: 'Цена по убыванию' },
  { value: 'price_asc', label: 'Цена по возрастанию' },
  { value: 'stock_asc', label: 'Остаток по возрастанию' },
  { value: 'stock_desc', label: 'Остаток по убыванию' },
  { value: 'rating_desc', label: 'Рейтинг по убыванию' },
]

const ORDER_STATUS_OPTIONS = [
  { value: 'pending', label: 'В обработке' },
  { value: 'confirmed', label: 'Подтверждён' },
  { value: 'shipped', label: 'Отправлен' },
  { value: 'delivered', label: 'Доставлен' },
  { value: 'cancelled', label: 'Отменён' },
]

const ORDER_STATUS_META = {
  pending: { label: 'В обработке', badge: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Подтверждён', badge: 'bg-blue-100 text-blue-700' },
  shipped: { label: 'Отправлен', badge: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Доставлен', badge: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Отменён', badge: 'bg-neutral-200 text-neutral-600' },
}

const ADMIN_TABS = [
  { id: 'books', label: 'Каталог' },
  { id: 'orders', label: 'Заказы' },
  { id: 'users', label: 'Пользователи' },
  { id: 'interactions', label: 'Взаимодействия' },
]

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('books')
  const [editingBook, setEditingBook] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [genreFilter, setGenreFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_desc')
  const [isFormExpanded, setIsFormExpanded] = useState(true)
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')
  const [orderSearchTerm, setOrderSearchTerm] = useState('')
  const [updatingOrderId, setUpdatingOrderId] = useState(null)

  const { data, isLoading, isError, refetch } = useBookList({ limit: 200 })
  const { createBook, updateBook, deleteBook, statuses } = useBookMutations()
  const adminOrdersParams = useMemo(() => {
    const params = { page: 1, limit: 50 }
    if (orderStatusFilter !== 'all') {
      params.status = orderStatusFilter
    }
    return params
  }, [orderStatusFilter])
  const {
    data: adminOrdersData,
    isLoading: adminOrdersLoading,
    isError: adminOrdersError,
    refetch: refetchAdminOrders,
  } = useAdminOrders(adminOrdersParams)
  const updateOrderStatus = useUpdateOrderStatus()

  const books = useMemo(() => {
    if (!data) return []
    if (Array.isArray(data)) return data
    return data.items || data.results || []
  }, [data])

  const genres = useMemo(() => {
    const unique = new Set(books.map((book) => book.genre).filter(Boolean))
    return ['all', ...Array.from(unique).sort((a, b) => a.localeCompare(b, 'ru'))]
  }, [books])

  const stats = useMemo(() => {
    const totalBooks = books.length
    const totalStock = books.reduce((sum, book) => sum + (book.stock || 0), 0)
    const lowStockBooks = books.filter((book) => book.stock > 0 && book.stock < 5).length
    const outOfStockBooks = books.filter((book) => (book.stock ?? 0) === 0).length
    const catalogValue = books.reduce(
      (sum, book) => sum + (book.price || 0) * (book.stock || 0),
      0,
    )

    return {
      totalBooks,
      totalStock,
      lowStockBooks,
      outOfStockBooks,
      catalogValue,
    }
  }, [books])

  const filteredBooks = useMemo(() => {
    let filtered = [...books]

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase()
      filtered = filtered.filter((book) =>
        [book.title, book.author, book.isbn, book.publisher]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(term)),
      )
    }

    if (genreFilter !== 'all') {
      filtered = filtered.filter((book) => book.genre === genreFilter)
    }

    if (stockFilter === 'low') {
      filtered = filtered.filter((book) => book.stock > 0 && book.stock < 5)
    } else if (stockFilter === 'out') {
      filtered = filtered.filter((book) => (book.stock ?? 0) === 0)
    }

    const sorter = (a, b) => {
      switch (sortBy) {
        case 'created_asc':
          return new Date(a.created_at) - new Date(b.created_at)
        case 'created_desc':
          return new Date(b.created_at) - new Date(a.created_at)
        case 'title_desc':
          return b.title.localeCompare(a.title, 'ru')
        case 'title_asc':
          return a.title.localeCompare(b.title, 'ru')
        case 'price_desc':
          return (b.price || 0) - (a.price || 0)
        case 'price_asc':
          return (a.price || 0) - (b.price || 0)
        case 'stock_desc':
          return (b.stock || 0) - (a.stock || 0)
        case 'stock_asc':
          return (a.stock || 0) - (b.stock || 0)
        case 'rating_desc':
          return (b.average_rating || 0) - (a.average_rating || 0)
        default:
          return 0
      }
    }

    filtered.sort(sorter)
    return filtered
  }, [books, searchTerm, genreFilter, stockFilter, sortBy])

  const adminOrdersRaw = adminOrdersData?.items ?? []
  const totalAdminOrders = adminOrdersData?.total_count ?? adminOrdersRaw.length
  const statusCounters = useMemo(() => {
    return adminOrdersRaw.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {})
  }, [adminOrdersRaw])
  const adminOrders = useMemo(() => {
    const term = orderSearchTerm.trim().toLowerCase()
    if (!term) return adminOrdersRaw
    return adminOrdersRaw.filter((order) => {
      const fields = [
        order.id,
        order.user_id,
        order.shipping_address?.city,
        order.shipping_address?.address,
        order.payment_method,
      ]
      return fields
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(term))
    })
  }, [adminOrdersRaw, orderSearchTerm])

  const handleCreate = async (payload, { reset }) => {
    try {
      await createBook(payload)
      toast.success('Книга добавлена')
      reset()
      refetch()
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        'Не удалось сохранить книгу. Проверьте данные.'
      toast.error(message)
    }
  }

  const handleUpdate = async (payload, { reset }) => {
    if (!editingBook) return
    try {
      await updateBook({ bookId: editingBook.id, data: payload })
      toast.success('Книга обновлена')
      reset()
      setIsEditModalOpen(false)
      setEditingBook(null)
      refetch()
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        'Не удалось обновить книгу. Проверьте данные.'
      toast.error(message)
    }
  }

  const handleDelete = async (book) => {
    if (!window.confirm(`Удалить книгу «${book.title}»?`)) return
    try {
      setDeletingId(book.id)
      await deleteBook(book.id)
      toast.success('Книга удалена')
      if (editingBook?.id === book.id) {
        setEditingBook(null)
        setIsEditModalOpen(false)
      }
      refetch()
    } catch {
      toast.error('Не удалось удалить книгу')
    } finally {
      setDeletingId(null)
    }
  }

  const resetFilters = () => {
    setSearchTerm('')
    setGenreFilter('all')
    setStockFilter('all')
    setSortBy('created_desc')
  }

  const resetOrderFilters = () => {
    setOrderSearchTerm('')
    setOrderStatusFilter('all')
  }

  const handleOrderStatusChange = (orderId, status) => {
    if (!status) return
    setUpdatingOrderId(orderId)
    updateOrderStatus.mutate(
      { orderId, status },
      {
        onSuccess: () => refetchAdminOrders(),
        onSettled: () => setUpdatingOrderId(null),
      },
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <section className="rounded-3xl bg-white p-6 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-primary">
              Панель администратора
            </p>
            <h1 className="text-3xl font-semibold text-neutral-900">
              Админ-панель
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Управляйте каталогом, заказами и пользователями
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {ADMIN_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'border-primary bg-primary text-white shadow-sm'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-primary hover:text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-8 flex flex-col gap-8">
        {activeTab === 'books' && (
          <>
          <section className="rounded-3xl bg-white p-8 shadow-card">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-primary">
                Управление каталогом
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-neutral-900">
                Каталог книг
              </h2>
              <p className="mt-2 max-w-xl text-sm text-neutral-500">
                Добавляйте новые книги, обновляйте описание и цену, контролируйте остатки и быстро находите нужные позиции.
              </p>
            </div>
            <div className="grid w-full gap-4 sm:grid-cols-2 lg:w-auto">
              <StatCard label="Всего книг" value={stats.totalBooks} />
              <StatCard label="Общий остаток" value={stats.totalStock} />
              <StatCard label="Мало на складе" value={stats.lowStockBooks} tone="warning" />
              <StatCard label="Нет в наличии" value={stats.outOfStockBooks} tone="danger" />
              <StatCard
                label="Стоимость каталога"
                value={formatPrice(stats.catalogValue)}
                span={2}
              />
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-neutral-100 bg-neutral-50/60">
            <button
              type="button"
              className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-medium text-neutral-600 transition hover:bg-neutral-100/60"
              onClick={() => setIsFormExpanded((prev) => !prev)}
            >
              <span>Создание новой книги</span>
              <span className="text-xs uppercase tracking-wide text-neutral-400">
                {isFormExpanded ? 'Свернуть' : 'Развернуть'}
              </span>
            </button>
            {isFormExpanded && (
              <div className="border-t border-neutral-100 bg-white px-6 py-6">
                <BookForm
                  initialData={null}
                  onSubmit={handleCreate}
                  isSubmitting={statuses.create === 'pending'}
                />
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-card">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Каталог книг</h2>
                <p className="text-sm text-neutral-500">
                  Найдено {filteredBooks.length} из {books.length} позиций
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditingBook(null)
                    setIsFormExpanded(true)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                >
                  Добавить новую книгу
                </Button>
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Сбросить фильтры
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Input
                label="Поиск"
                placeholder="Название, автор, ISBN..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              <div>
                <label className="text-sm font-medium text-neutral-700">Жанр</label>
                <select
                  className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={genreFilter}
                  onChange={(event) => setGenreFilter(event.target.value)}
                >
                  {genres.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre === 'all' ? 'Все жанры' : genre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700">Склад</label>
                <select
                  className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={stockFilter}
                  onChange={(event) => setStockFilter(event.target.value)}
                >
                  <option value="all">Все товары</option>
                  <option value="low">Мало на складе (&lt;5)</option>
                  <option value="out">Нет в наличии</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700">Сортировка</label>
                <select
                  className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <QuickFilter
                active={stockFilter === 'low'}
                label="Мало на складе"
                onClick={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
              />
              <QuickFilter
                active={stockFilter === 'out'}
                label="Нет в наличии"
                onClick={() => setStockFilter(stockFilter === 'out' ? 'all' : 'out')}
              />
              <QuickFilter
                active={Boolean(searchTerm)}
                label="Поиск активен"
                onClick={() => setSearchTerm('')}
              />
            </div>
          </div>

          {isLoading ? (
            <Loading message="Загружаем книги..." />
          ) : isError ? (
            <ErrorMessage
              description="Не удалось загрузить список книг."
              action={
                <Button size="sm" variant="secondary" onClick={() => refetch()}>
                  Повторить попытку
                </Button>
              }
            />
          ) : filteredBooks.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-neutral-200 bg-white p-12 text-center">
              <p className="text-sm text-neutral-500">
                По текущим фильтрам книги не найдены.
              </p>
              <Button className="mt-4" size="sm" variant="secondary" onClick={resetFilters}>
                Сбросить фильтры
              </Button>
            </div>
          ) : (
            <BookTable
              books={filteredBooks}
              onEdit={(book) => {
                setEditingBook(book)
                setIsEditModalOpen(true)
              }}
              onDelete={handleDelete}
              isDeletingId={deletingId}
            />
          )}
        </section>
          </>
        )}

        {activeTab === 'orders' && (
        <section className="space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-card space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Заказы</h2>
                <p className="text-sm text-neutral-500">
                  Управление статусами и мониторинг заказов пользователей
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => refetchAdminOrders()}>
                  Обновить данные
                </Button>
                <Button variant="secondary" size="sm" onClick={resetOrderFilters}>
                  Сбросить фильтры
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard label="Всего заказов" value={totalAdminOrders} />
              <StatCard
                label="В обработке"
                value={statusCounters.pending ?? 0}
                tone="warning"
              />
              <StatCard
                label="Подтверждены"
                value={statusCounters.confirmed ?? 0}
                tone="default"
              />
              <StatCard
                label="Отправлены"
                value={statusCounters.shipped ?? 0}
                tone="default"
              />
              <StatCard
                label="Доставлены"
                value={statusCounters.delivered ?? 0}
                tone="default"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Input
                label="Поиск по заказам"
                placeholder="ID заказа, пользователь, адрес..."
                value={orderSearchTerm}
                onChange={(event) => setOrderSearchTerm(event.target.value)}
              />
              <div>
                <label className="text-sm font-medium text-neutral-700">Статус</label>
                <select
                  className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={orderStatusFilter}
                  onChange={(event) => setOrderStatusFilter(event.target.value)}
                >
                  <option value="all">Все статусы</option>
                  {ORDER_STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <QuickFilter
                active={orderStatusFilter === 'all'}
                label={`Все (${totalAdminOrders})`}
                onClick={() => setOrderStatusFilter('all')}
              />
              {ORDER_STATUS_OPTIONS.map((status) => (
                <QuickFilter
                  key={status.value}
                  active={orderStatusFilter === status.value}
                  label={`${status.label} (${statusCounters[status.value] ?? 0})`}
                  onClick={() =>
                    setOrderStatusFilter(
                      orderStatusFilter === status.value ? 'all' : status.value,
                    )
                  }
                />
              ))}
            </div>
          </div>

          {adminOrdersLoading ? (
            <Loading message="Загружаем заказы..." />
          ) : adminOrdersError ? (
            <ErrorMessage
              description="Не удалось загрузить заказы."
              action={
                <Button size="sm" variant="secondary" onClick={() => refetchAdminOrders()}>
                  Повторить попытку
                </Button>
              }
            />
          ) : adminOrders.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-neutral-200 bg-white p-12 text-center">
              <p className="text-sm text-neutral-500">
                По текущим фильтрам заказы не найдены.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-neutral-100 bg-white shadow-card">
              <div className="max-h-[70vh] overflow-auto">
                <table className="min-w-full divide-y divide-neutral-100 text-sm">
                  <thead className="sticky top-0 z-10 bg-neutral-50 text-left text-neutral-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Номер</th>
                      <th className="px-4 py-3 font-medium">Дата</th>
                      <th className="px-4 py-3 font-medium">Пользователь</th>
                      <th className="px-4 py-3 font-medium">Товары</th>
                      <th className="px-4 py-3 font-medium">Сумма</th>
                      <th className="px-4 py-3 font-medium">Статус</th>
                      <th className="px-4 py-3 font-medium">Доставка</th>
                      <th className="px-4 py-3 font-medium">Оплата</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-700">
                    {adminOrders.map((order) => {
                      const itemsCount = order.items?.length ?? 0
                      const statusMeta = ORDER_STATUS_META[order.status] ?? {
                        label: order.status,
                        badge: 'bg-neutral-100 text-neutral-600',
                      }
                      const isFinalStatus =
                        order.status === 'delivered' || order.status === 'cancelled'
                      const isUpdating = updatingOrderId === order.id

                      return (
                        <tr key={order.id} className="hover:bg-neutral-50/70">
                          <td className="px-4 py-3 font-semibold text-neutral-900">
                            #{order.id.slice(0, 8)}
                          </td>
                          <td className="px-4 py-3 text-neutral-500">
                            <div className="flex flex-col gap-0.5">
                              <span>{formatDate(order.created_at)}</span>
                              <span className="text-xs text-neutral-400">
                                обновлён {formatDate(order.updated_at)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium text-neutral-800">
                                Пользователь #{order.user_id?.slice(0, 6) || '—'}
                              </span>
                              <span className="text-xs text-neutral-400">
                                {itemsCount} {itemsCount === 1 ? 'товар' : 'товара'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-neutral-600">
                            {order.items?.slice(0, 2).map((item, index) => (
                              <p key={index} className="text-xs">
                                {item.title} · {item.quantity} шт.
                              </p>
                            ))}
                            {itemsCount > 2 && (
                              <p className="text-xs text-neutral-400">
                                + ещё {itemsCount - 2}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 font-semibold text-neutral-900">
                            {formatPrice(order.total_amount)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-2">
                              <span
                                className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-medium ${statusMeta.badge}`}
                              >
                                {statusMeta.label}
                              </span>
                              <select
                                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={order.status}
                                onChange={(event) =>
                                  handleOrderStatusChange(order.id, event.target.value)
                                }
                                disabled={isFinalStatus || isUpdating}
                              >
                                {ORDER_STATUS_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              {isFinalStatus && (
                                <p className="text-[10px] text-neutral-400">
                                  Статус финальный и не может быть изменён
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-neutral-600">
                            <div className="text-xs">
                              <p>{order.shipping_address?.city}</p>
                              <p className="text-neutral-400">
                                {order.shipping_address?.address}
                              </p>
                              <p className="text-neutral-400">
                                {order.shipping_address?.postal_code}, {order.shipping_address?.country}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-neutral-500">
                            {order.payment_method === 'cash' ? 'Наличные' : 'Карта'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
        )}

        {activeTab === 'users' && <AdminUsersTab />}
        {activeTab === 'interactions' && <AdminInteractionsTab />}
      </div>

      <BookEditModal
        book={editingBook}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingBook(null)
        }}
        onSubmit={handleUpdate}
        isSubmitting={statuses.update === 'pending'}
      />
    </div>
  )
}

const StatCard = ({ label, value, tone = 'default', span = 1 }) => {
  const toneStyles = {
    default:
      'bg-neutral-50 text-neutral-900 border-neutral-100',
    warning:
      'bg-amber-50 text-amber-800 border-amber-100',
    danger:
      'bg-red-50 text-red-800 border-red-100',
  }

  return (
    <div
      className={`flex flex-col justify-between rounded-2xl border p-5 ${toneStyles[tone] ?? toneStyles.default} ${span > 1 ? 'sm:col-span-2' : ''}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  )
}

const QuickFilter = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
      active
        ? 'border-primary bg-primary/10 text-primary shadow-sm'
        : 'border-neutral-200 text-neutral-500 hover:border-primary hover:text-primary'
    }`}
  >
    {label}
  </button>
)

export default AdminDashboardPage

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { Heart, ShoppingBag, Sparkles, BookOpen } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Loading from '../components/common/Loading'
import ErrorMessage from '../components/common/ErrorMessage'
import BookGrid from '../components/books/BookGrid'
import { useAuth } from '../hooks/useAuth'
import { useFavorites } from '../hooks/useInteractions'
import { useBooksByIds } from '../hooks/useBooks'
import { usePersonalRecommendations } from '../hooks/useRecommendations'
import { useOrders } from '../hooks/useOrders'
import { useCartActions } from '../hooks/useCartActions'
import usersApi from '../api/users'
import { GENRES } from '../utils/constants'
import { formatDate, formatPrice, getInitials } from '../utils/helpers'

const ProfilePage = () => {
  const { user, updateUser } = useAuth()
  const { handleAddToCart, handleToggleFavorite, isFavorite } = useCartActions()
  const { favorites, isLoading: favoritesLoading } = useFavorites()
  const userId = user?.id

  const {
    data: ordersData,
    isLoading: ordersLoading,
    isError: ordersError,
  } = useOrders()

  const {
    data: personalRecs,
    isLoading: recsLoading,
    isError: recsError,
  } = usePersonalRecommendations(Boolean(userId))

  const favoriteIds = useMemo(
    () => (favorites ? Array.from(favorites) : []),
    [favorites],
  )

  const {
    data: favoriteBooksResponse,
    isLoading: favoriteBooksLoading,
    isError: favoriteBooksError,
  } = useBooksByIds(favoriteIds)

  const favoriteBooks = favoriteBooksResponse ?? []

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isDirty },
  } = useForm({
    defaultValues: {
      full_name: user?.full_name || '',
      favorite_genres: user?.favorite_genres || [],
      favorite_authors: (user?.favorite_authors || []).join(', '),
    },
  })

  const selectedGenres = watch('favorite_genres')

  const updateMutation = useMutation({
    mutationFn: async (values) => {
      if (!userId) {
        throw new Error('Пользователь не найден')
      }
      const response = await usersApi.updateUser(userId, {
        full_name: values.full_name,
        favorite_genres: values.favorite_genres,
        favorite_authors: values.favorite_authors
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      })
      return response.data
    },
    onSuccess: (data) => {
      updateUser(data)
      toast.success('Профиль обновлён')
    },
    onError: () => toast.error('Не удалось обновить профиль'),
  })

  const onSubmit = handleSubmit((values) => updateMutation.mutate(values))

  const toggleGenre = (genre) => {
    const genres = new Set(selectedGenres)
    if (genres.has(genre)) {
      genres.delete(genre)
    } else {
      genres.add(genre)
    }
    setValue('favorite_genres', Array.from(genres), { shouldDirty: true })
  }

  const ordersCount = ordersData?.length ?? 0
  const favoritesCount = favoriteIds.length
  const totalSpent = useMemo(
    () => (ordersData || []).reduce((sum, order) => sum + (order?.total_amount ?? 0), 0),
    [ordersData],
  )

  const stats = useMemo(
    () => [
      {
        label: 'Избранные книги',
        value: favoritesCount,
        description: 'любимые истории',
        icon: Heart,
      },
      {
        label: 'Оформлено заказов',
        value: ordersCount,
        description: 'за всё время',
        icon: ShoppingBag,
      },
      {
        label: 'Потрачено в магазине',
        value: formatPrice(totalSpent),
        description: 'включая доставку',
        icon: Sparkles,
      },
    ],
    [favoritesCount, ordersCount, totalSpent],
  )

  if (!user) {
    return <Loading message="Загружаем профиль..." />
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="container mx-auto px-4">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/80 to-primary/65 px-8 py-10 text-white shadow-2xl">
          <div className="absolute -top-24 -right-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" aria-hidden />
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-white/5 blur-2xl" aria-hidden />
          <div className="relative z-10 grid gap-8 md:grid-cols-[1.6fr,1fr] md:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs uppercase tracking-wide text-white/80">
                <BookOpen className="h-3.5 w-3.5" />
                Профиль читателя
              </span>
              <h1 className="mt-4 text-3xl font-semibold md:text-4xl">
                Привет, {user.full_name || user.username}!
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-white/80 md:text-base">
                Следите за любимыми книгами, обновляйте предпочтения и управляйте заказами в одном месте. Мы подберём для вас свежие истории на основе интересов.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button as={Link} to="/catalog" size="lg" variant="secondary">
                  Перейти в каталог
                </Button>
                <Button as={Link} to="/orders" variant="ghost" className="text-white hover:bg-white/15">
                  Мои заказы
                </Button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {stats.map((stat) => {
                const Icon = stat.icon
                return (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/10 bg-white/15 p-4 backdrop-blur transition hover:border-white/20 hover:bg-white/20"
                  >
                    <Icon className="h-4 w-4 text-white/80" />
                    <p className="mt-3 text-2xl font-semibold">{stat.value}</p>
                    <p className="text-xs font-medium uppercase tracking-wider text-white/70">
                      {stat.label}
                    </p>
                    <p className="mt-1 text-xs text-white/60">{stat.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <div className="mt-10 grid gap-8 lg:grid-cols-[350px,1fr]">
          <div className="space-y-8">
            <Card className="shadow-card">
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-white/80 to-white/50 text-2xl font-semibold text-primary shadow-lg">
                    {getInitials(user.full_name || user.username)}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-neutral-900">
                      {user.full_name || user.username}
                    </h2>
                    <p className="text-sm text-neutral-500">{user.email}</p>
                  </div>
                </div>

                <dl className="grid gap-4 text-sm text-neutral-600">
                  <div className="rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                      Дата регистрации
                    </dt>
                    <dd className="mt-1 text-base font-semibold text-neutral-900">
                      {formatDate(user.created_at)}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                      Последний вход
                    </dt>
                    <dd className="mt-1 text-base font-semibold text-neutral-900">
                      {formatDate(user.last_login)}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                      Любимые жанры
                    </dt>
                    <dd className="mt-1 text-base font-semibold text-neutral-900">
                      {(user.favorite_genres || []).join(', ') || 'Вы ещё не выбрали жанры'}
                    </dd>
                  </div>
                </dl>
              </div>
            </Card>

            <Card
              className="shadow-card"
              header={
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">Предпочтения</h3>
                  <p className="text-sm text-neutral-500">
                    Укажите любимые жанры и авторов, чтобы улучшить персональные рекомендации.
                  </p>
                </div>
              }
              footer={
                <Button
                  type="submit"
                  form="profile-form"
                  disabled={!isDirty || updateMutation.isPending}
                  isLoading={updateMutation.isPending}
                  className="w-full"
                >
                  Сохранить изменения
                </Button>
              }
            >
              <form id="profile-form" className="space-y-5" onSubmit={onSubmit}>
                <div>
                  <label className="text-sm font-medium text-neutral-700">
                    Полное имя
                  </label>
                  <input
                    className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Иван Иванов"
                    {...register('full_name')}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700">
                    Любимые авторы
                  </label>
                  <textarea
                    className="mt-2 h-28 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Введите авторов через запятую"
                    {...register('favorite_authors')}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-700">Любимые жанры</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {GENRES.map((genre) => {
                      const selected = selectedGenres?.includes(genre)
                      return (
                        <button
                          key={genre}
                          type="button"
                          onClick={() => toggleGenre(genre)}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                            selected
                              ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/40'
                              : 'border border-neutral-200 text-neutral-500 hover:border-primary/60 hover:text-primary'
                          }`}
                        >
                          {genre}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </form>
            </Card>
          </div>

          <div className="space-y-8">
            <Card
              className="shadow-card"
              header={
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900">Избранные книги</h3>
                    <p className="text-sm text-neutral-500">
                      Все ваши лайки в одном месте. Добавляйте в корзину или убирайте из избранного.
                    </p>
                  </div>
                  <Button as={Link} to="/catalog" variant="ghost" size="sm">
                    Перейти в каталог
                  </Button>
                </div>
              }
            >
              {favoritesLoading || favoriteBooksLoading ? (
                <Loading message="Загружаем избранные книги..." />
              ) : favoriteBooksError ? (
                <ErrorMessage description="Не удалось загрузить избранное." />
              ) : favoritesCount === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-10 text-center">
                  <p className="text-sm text-neutral-500">
                    В избранном пока пусто. Найдите книги, которые вам нравятся, и нажмите на иконку сердца.
                  </p>
                  <Button as={Link} to="/catalog" variant="secondary" size="sm" className="mt-4">
                    Открыть каталог
                  </Button>
                </div>
              ) : (
                <BookGrid
                  books={favoriteBooks}
                  isLoading={false}
                  isError={false}
                  onAddToCart={handleAddToCart}
                  onToggleFavorite={handleToggleFavorite}
                  isFavorite={isFavorite}
                  compact={false}
                />
              )}
            </Card>

            <Card
              className="shadow-card"
              header={
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900">Последние заказы</h3>
                    <p className="text-sm text-neutral-500">Сводка по четырём последним заказам</p>
                  </div>
                  {ordersCount > 0 && (
                    <Button as={Link} to="/orders" variant="ghost" size="sm">
                      Все заказы
                    </Button>
                  )}
                </div>
              }
            >
              {ordersLoading ? (
                <Loading message="Загружаем заказы..." />
              ) : ordersError ? (
                <ErrorMessage description="Не удалось загрузить заказы." />
              ) : ordersCount > 0 ? (
                <div className="space-y-3">
                  {ordersData.slice(0, 4).map((order) => {
                    const statusMeta = {
                      pending: { label: 'В обработке', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
                      confirmed: { label: 'Подтверждён', badge: 'bg-blue-100 text-blue-700 border-blue-200' },
                      shipped: { label: 'Отправлен', badge: 'bg-purple-100 text-purple-700 border-purple-200' },
                      delivered: { label: 'Доставлен', badge: 'bg-green-100 text-green-700 border-green-200' },
                      cancelled: { label: 'Отменён', badge: 'bg-neutral-200 text-neutral-600 border-neutral-300' },
                    }[order.status] || { label: 'В обработке', badge: 'bg-amber-100 text-amber-700 border-amber-200' }

                    return (
                      <Link
                        key={order.id}
                        to="/orders"
                        className="group block rounded-xl border border-neutral-100 bg-gradient-to-br from-white to-neutral-50/50 p-4 transition-all hover:border-primary/30 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="text-sm font-semibold text-neutral-900">
                                Заказ #{order.id.slice(0, 8)}
                              </p>
                              <span
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusMeta.badge}`}
                              >
                                {statusMeta.label}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-500 mb-3">
                              {formatDate(order.created_at)}
                            </p>
                            {order.items?.length > 0 && (
                              <div className="space-y-1.5">
                                {order.items.slice(0, 2).map((item, index) => (
                                  <div key={index} className="flex items-center justify-between text-xs">
                                    <span className="line-clamp-1 font-medium text-neutral-700 flex-1 min-w-0 mr-2">
                                      {item.title}
                                    </span>
                                    <span className="text-neutral-500 whitespace-nowrap">
                                      {item.quantity} × {formatPrice(item.price_at_purchase)}
                                    </span>
                                  </div>
                                ))}
                                {order.items.length > 2 && (
                                  <p className="text-xs text-neutral-400">
                                    + ещё {order.items.length - 2} {order.items.length - 2 === 1 ? 'товар' : 'товара'}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-lg font-bold text-neutral-900">
                              {formatPrice(order.total_amount)}
                            </p>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              {order.items.length} {order.items.length === 1 ? 'товар' : order.items.length < 5 ? 'товара' : 'товаров'}
                            </p>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-neutral-200 bg-gradient-to-br from-neutral-50 to-white p-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                    <ShoppingBag className="h-6 w-6 text-neutral-400" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-neutral-700">
                    У вас пока нет заказов
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Добавляйте книги в корзину и оформляйте покупку прямо сейчас
                  </p>
                  <Button as={Link} to="/catalog" variant="secondary" size="sm" className="mt-4">
                    Начать покупки
                  </Button>
                </div>
              )}
            </Card>

            <Card
              className="shadow-card"
              header={
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">Рекомендации для вас</h3>
                  <p className="text-sm text-neutral-500">
                    Сформированы на основе ваших предпочтений и активности.
                  </p>
                </div>
              }
            >
              {recsLoading ? (
                <Loading message="Подбираем рекомендации..." />
              ) : recsError ? (
                <ErrorMessage description="Не удалось загрузить рекомендации." />
              ) : (personalRecs?.length ?? 0) > 0 ? (
                <BookGrid
                  books={personalRecs.slice(0, 12)}
                  isLoading={false}
                  isError={false}
                  onAddToCart={handleAddToCart}
                  onToggleFavorite={handleToggleFavorite}
                  isFavorite={isFavorite}
                  compact
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-10 text-center">
                  <p className="text-sm text-neutral-500">
                    Делайте покупки, ставьте лайки и добавляйте книги в корзину — мы начнём рекомендовать истории, которые точно понравятся.
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage


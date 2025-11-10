import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Loading from '../components/common/Loading'
import ErrorMessage from '../components/common/ErrorMessage'
import { useAuth } from '../hooks/useAuth'
import { useInteractions } from '../hooks/useInteractions'
import { usePersonalRecommendations } from '../hooks/useRecommendations'
import { useOrders } from '../hooks/useOrders'
import { useCartActions } from '../hooks/useCartActions'
import usersApi from '../api/users'
import { GENRES } from '../utils/constants'
import { formatDate, formatPrice, getInitials } from '../utils/helpers'

const ProfilePage = () => {
  const { user, updateUser } = useAuth()
  const { isLoading } = useInteractions({ fetch: true })
  const { handleAddToCart } = useCartActions()

  const userId = user?.id

  const historyQuery = useQuery({
    queryKey: ['users', userId, 'history'],
    queryFn: async () => {
      const response = await usersApi.getHistory(userId)
      return response.data
    },
    enabled: Boolean(userId),
  })

  const {
    data: personalRecs,
    isLoading: recsLoading,
    isError: recsError,
  } = usePersonalRecommendations(Boolean(userId))

  const {
    data: ordersData,
    isLoading: ordersLoading,
    isError: ordersError,
  } = useOrders()

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
      toast.success('Профиль обновлен')
    },
    onError: () => toast.error('Не удалось обновить профиль'),
  })

  const onSubmit = handleSubmit((values) => updateMutation.mutate(values))

  const purchases = useMemo(
    () =>
      (historyQuery.data || []).filter(
        (item) => item.interaction_type === 'purchase',
      ),
    [historyQuery.data],
  )

  const toggleGenre = (genre) => {
    const genres = new Set(selectedGenres)
    if (genres.has(genre)) {
      genres.delete(genre)
    } else {
      genres.add(genre)
    }
    setValue('favorite_genres', Array.from(genres), { shouldDirty: true })
  }

  if (!user) {
    return <Loading message="Загружаем профиль..." />
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="grid gap-8 lg:grid-cols-[340px,1fr]">
        <Card
          header={
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-semibold text-white">
                {getInitials(user.full_name || user.username)}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">
                  {user.full_name || user.username}
                </h2>
                <p className="text-sm text-neutral-500">{user.email}</p>
              </div>
            </div>
          }
        >
          <dl className="space-y-4 text-sm text-neutral-500">
            <div>
              <dt className="font-medium text-neutral-700">Дата регистрации</dt>
              <dd>{formatDate(user.created_at)}</dd>
            </div>
            <div>
              <dt className="font-medium text-neutral-700">Последний вход</dt>
              <dd>{formatDate(user.last_login)}</dd>
            </div>
            <div>
              <dt className="font-medium text-neutral-700">Любимые жанры</dt>
              <dd>{(user.favorite_genres || []).join(', ') || '—'}</dd>
            </div>
          </dl>
        </Card>

        <div className="space-y-8">
          <Card
            header={<h3 className="text-lg font-semibold">Редактировать профиль</h3>}
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">
                  Полное имя
                </label>
                <input
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Иван Иванов"
                  {...register('full_name')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">
                  Любимые авторы
                </label>
                <textarea
                  className="h-24 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Введите через запятую"
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
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                          selected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-neutral-200 text-neutral-500 hover:border-primary/60'
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

          <Card
            header={
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Мои заказы</h3>
                  <p className="mt-1 text-xs text-neutral-500">История ваших покупок</p>
                </div>
                {ordersData?.length > 0 && (
                  <Link to="/orders" className="text-sm text-primary hover:underline">
                    Все заказы
                  </Link>
                )}
              </div>
            }
          >
            {ordersLoading ? (
              <Loading message="Загружаем заказы..." />
            ) : ordersError ? (
              <ErrorMessage description="Не удалось загрузить заказы." />
            ) : ordersData?.length ? (
              <div className="space-y-3">
                {ordersData.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="group rounded-xl border border-neutral-100 bg-white p-4 transition hover:border-primary hover:shadow-md"
                  >
                    <div className="flex items-start justify-between border-b border-neutral-100 pb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-neutral-900">
                            Заказ #{order.id.slice(0, 8)}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              order.status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : order.status === 'confirmed'
                                ? 'bg-blue-100 text-blue-700'
                                : order.status === 'shipped'
                                ? 'bg-purple-100 text-purple-700'
                                : order.status === 'delivered'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            {order.status === 'pending'
                              ? 'В обработке'
                              : order.status === 'confirmed'
                              ? 'Подтверждён'
                              : order.status === 'shipped'
                              ? 'Отправлен'
                              : order.status === 'delivered'
                              ? 'Доставлен'
                              : 'Отменён'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-neutral-500">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-neutral-900">
                          {formatPrice(order.total_amount)}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {order.items.length} {order.items.length === 1 ? 'товар' : order.items.length < 5 ? 'товара' : 'товаров'}
                        </p>
                      </div>
                    </div>
                    {order.items?.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex items-start justify-between text-xs">
                            <div className="flex-1">
                              <p className="font-medium text-neutral-800 line-clamp-1">
                                {item.title}
                              </p>
                              <p className="text-neutral-500">
                                {item.author} • {item.quantity} шт.
                              </p>
                            </div>
                            <span className="ml-2 font-semibold text-neutral-700">
                              {formatPrice(item.price_at_purchase * item.quantity)}
                            </span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <p className="text-xs text-neutral-500">
                            + ещё {order.items.length - 3} {order.items.length - 3 === 1 ? 'товар' : 'товара'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center">
                <p className="text-sm text-neutral-500">
                  У вас пока нет заказов. Начните с просмотра каталога!
                </p>
                <Link to="/catalog">
                  <Button variant="secondary" size="sm" className="mt-4">
                    Перейти в каталог
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          <Card
            header={
              <div>
                <h3 className="text-lg font-semibold">Рекомендовано для вас</h3>
                <p className="mt-1 text-xs text-neutral-500">На основе ваших интересов</p>
              </div>
            }
          >
            {recsLoading ? (
              <Loading message="Подбираем рекомендации..." />
            ) : recsError ? (
              <ErrorMessage description="Не удалось загрузить рекомендации." />
            ) : personalRecs?.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
                {personalRecs.slice(0, 10).map((book) => (
                  <div
                    key={book.id}
                    className="group flex flex-col rounded-xl bg-neutral-50 p-3 transition hover:bg-neutral-100 hover:shadow-md"
                  >
                    <Link to={`/books/${book.id}`} className="block">
                      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-neutral-200">
                        {book.cover_image_url ? (
                          <img
                            src={book.cover_image_url}
                            alt={book.title}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
                            Нет фото
                          </div>
                        )}
                      </div>
                      <h4 className="mt-2 line-clamp-2 text-xs font-semibold text-neutral-900 leading-tight">
                        {book.title}
                      </h4>
                      <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">
                        {book.author}
                      </p>
                    </Link>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-bold text-neutral-900">
                        {formatPrice(book.price)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddToCart(book)}
                        className="rounded-lg bg-primary px-2 py-1 text-xs font-medium text-white transition hover:bg-primary-700 active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center">
                <p className="text-sm text-neutral-500">
                  Взаимодействуйте с каталогом, чтобы получить персональные рекомендации.
                </p>
                <Link to="/catalog">
                  <Button variant="secondary" size="sm" className="mt-4">
                    Перейти в каталог
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage


import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Loading from '../components/common/Loading'
import { useAuth } from '../hooks/useAuth'
import { useInteractions } from '../hooks/useInteractions'
import usersApi from '../api/users'
import { GENRES } from '../utils/constants'
import { formatDate, formatPrice, getInitials } from '../utils/helpers'

const ProfilePage = () => {
  const { user, updateUser } = useAuth()
  const { isLoading } = useInteractions({ fetch: true })

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
            header={<h3 className="text-lg font-semibold">История покупок</h3>}
          >
            {isLoading || historyQuery.isLoading ? (
              <Loading message="Загружаем историю..." />
            ) : purchases.length ? (
              <ul className="divide-y divide-neutral-100">
                {purchases.map((item) => (
                  <li key={item.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-neutral-800">
                        {item.metadata?.title || 'Покупка'}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {formatDate(item.timestamp)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-neutral-700">
                      {item.metadata?.price
                        ? formatPrice(item.metadata.price)
                        : `${item.metadata?.quantity || 1} шт.`}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-500">
                Вы ещё не совершали покупок. Начните с просмотра каталога!
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage


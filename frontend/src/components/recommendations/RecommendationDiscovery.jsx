import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import RecommendationCarousel from './RecommendationCarousel'
import Loading from '../common/Loading'
import ErrorMessage from '../common/ErrorMessage'
import Button from '../common/Button'
import { useRecommendationFeed } from '../../hooks/useRecommendations'
import { useAuthStore } from '../../store/authStore'

const STRATEGIES = [
  {
    id: 'personal',
    label: 'Для вас',
    description: 'Персональные рекомендации на основе ваших действий',
    requiresAuth: true,
    title: 'Персональные рекомендации',
    subtitle: 'Собраны из истории просмотров, предпочтений и заказов',
  },
  {
    id: 'trending',
    label: 'Популярное',
    description: 'Что сейчас выбирают другие читатели',
    title: 'Популярное сейчас',
    subtitle: 'Самые просматриваемые и покупаемые книги последних недель',
    defaultParams: { days: 14, limit: 12 },
  },
  {
    id: 'new',
    label: 'Новинки',
    description: 'Свежие поступления каталога',
    title: 'Новые поступления',
    subtitle: 'Только что добавленные книги и громкие релизы',
    defaultParams: { limit: 12 },
  },
  {
    id: 'genre',
    label: 'По жанрам',
    description: 'Подборки в любимых жанрах',
    title: 'Рекомендации по жанрам',
    subtitle: (genreLabel) =>
      genreLabel
        ? `Лучшие книги в жанре «${genreLabel}»`
        : 'Выберите жанр, чтобы увидеть подборку',
  },
]

const RecommendationDiscovery = ({ 
  genres = [], 
  onAddToCart, 
  onToggleFavorite,
  isFavorite,
}) => {
  const { user, isAuthenticated } = useAuthStore()
  const [activeStrategy, setActiveStrategy] = useState(
    isAuthenticated ? 'personal' : 'trending',
  )
  const [selectedGenre, setSelectedGenre] = useState(
    genres.length > 0 ? genres[0] : '',
  )

  useEffect(() => {
    if (!genres.length) {
      setSelectedGenre('')
      return
    }
    if (!selectedGenre || !genres.includes(selectedGenre)) {
      setSelectedGenre(genres[0])
    }
  }, [genres, selectedGenre])

  useEffect(() => {
    if (activeStrategy === 'personal' && !isAuthenticated) {
      setActiveStrategy('trending')
    }
  }, [activeStrategy, isAuthenticated])

  const strategyConfig = useMemo(
    () => STRATEGIES.find((item) => item.id === activeStrategy),
    [activeStrategy],
  )

  const params = useMemo(() => {
    if (!strategyConfig) return {}
    if (strategyConfig.id === 'genre') {
      return selectedGenre
        ? { genre: selectedGenre, limit: 12 }
        : { genre: undefined }
    }
    return strategyConfig.defaultParams ?? { limit: 12 }
  }, [strategyConfig, selectedGenre])

  const isStrategyEnabled =
    strategyConfig &&
    (!strategyConfig.requiresAuth || isAuthenticated) &&
    (strategyConfig.id !== 'genre' || Boolean(selectedGenre))

  const {
    data: books = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useRecommendationFeed({
    strategy: strategyConfig?.id,
    params,
    enabled: Boolean(strategyConfig) && isStrategyEnabled,
  })

  const subtitle =
    typeof strategyConfig?.subtitle === 'function'
      ? strategyConfig.subtitle(selectedGenre)
      : strategyConfig?.subtitle

  return (
    <section className="rounded-3xl bg-white p-6 shadow-card lg:p-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            Рекомендации
          </p>
          <h2 className="text-2xl font-semibold text-neutral-900 lg:text-3xl">
            {strategyConfig?.title ?? 'Подборки'}
          </h2>
          {subtitle && (
            <p className="text-sm text-neutral-500">{subtitle}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {STRATEGIES.map((strategy) => {
            const disabled =
              (strategy.requiresAuth && !isAuthenticated) ||
              (strategy.id === 'genre' && !genres.length)
            return (
              <button
                key={strategy.id}
                type="button"
                onClick={() => setActiveStrategy(strategy.id)}
                disabled={disabled}
                className={clsx(
                  'rounded-full border px-4 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0',
                  activeStrategy === strategy.id
                    ? 'border-primary bg-primary text-white shadow-sm'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-primary hover:text-primary',
                  disabled &&
                    'cursor-not-allowed border-neutral-100 text-neutral-300 hover:border-neutral-100 hover:text-neutral-300',
                )}
              >
                {strategy.label}
              </button>
            )
          })}
        </div>
      </div>

      {strategyConfig?.id === 'genre' && genres.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-neutral-500">Жанр:</span>
          {genres.map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => setSelectedGenre(genre)}
              className={clsx(
                'rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide transition shrink-0',
                selectedGenre === genre
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-neutral-200 text-neutral-500 hover:border-primary hover:text-primary',
              )}
            >
              {genre}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6">
        {isLoading || (isFetching && !books.length) ? (
          <Loading message="Загружаем подборку..." />
        ) : isError ? (
          <ErrorMessage
            description="Не удалось получить рекомендации. Попробуйте обновить."
            action={
              <Button size="sm" variant="secondary" onClick={() => refetch()}>
                Повторить попытку
              </Button>
            }
          />
        ) : !books.length ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-neutral-500">
            Пока нет книг для отображения. Попробуйте выбрать другой алгоритм или
            жанр.
          </div>
        ) : (
          <RecommendationCarousel 
            books={books} 
            onAddToCart={onAddToCart}
            onToggleFavorite={onToggleFavorite}
            isFavorite={isFavorite}
          />
        )}
      </div>
    </section>
  )
}

export default RecommendationDiscovery



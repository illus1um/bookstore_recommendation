import { ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import SearchBar from '../components/books/SearchBar'
import Button from '../components/common/Button'
import RecommendationCarousel from '../components/recommendations/RecommendationCarousel'
import RecommendationDiscovery from '../components/recommendations/RecommendationDiscovery'
import TrendingBooks from '../components/recommendations/TrendingBooks'
import { useNewBooks } from '../hooks/useRecommendations'
import { useCartActions } from '../hooks/useCartActions'
import Loading from '../components/common/Loading'
import ErrorMessage from '../components/common/ErrorMessage'
import { useBookFilters } from '../hooks/useBooks'

const HomePage = () => {
  const {
    data: newBooks,
    isLoading: newBooksLoading,
    isError: newBooksError,
    refetch: refetchNewBooks,
    isFetching: isFetchingNewBooks,
  } = useNewBooks({ limit: 12 })
  const { data: filters } = useBookFilters()
  const { handleAddToCart, handleToggleFavorite } = useCartActions()

  const genresToShow = (filters?.genres ?? []).slice(0, 6)

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/80 to-primary/60 text-white">
        <div className="container mx-auto grid gap-10 px-4 py-20 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-sm">
              <Sparkles className="h-4 w-4" />
              Лучшие рекомендации для вас
            </span>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              Найдите идеальную книгу под ваше настроение
            </h1>
            <p className="text-lg text-white/80">
              Персональные рекомендации, популярные новинки и огромный каталог в одном
              месте.
            </p>
            <div className="max-w-xl">
              <SearchBar />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button as={Link} to="/catalog" size="lg">
                Перейти в каталог
              </Button>
              <Link
                to="/catalog"
                className="inline-flex items-center gap-2 text-sm font-medium text-white/80 underline-offset-4 hover:underline"
              >
                Смотреть популярное
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-white/20 blur-3xl" />
            <div className="relative rounded-3xl bg-white/10 p-8 shadow-2xl backdrop-blur">
              <p className="text-sm uppercase tracking-wider text-white/70">
                Почему выбирают нас
              </p>
              <ul className="mt-4 space-y-3">
                <li className="flex items-center gap-3 text-sm text-white/90">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                    01
                  </span>
                  Персональные рекомендации на основе предпочтений
                </li>
                <li className="flex items-center gap-3 text-sm text-white/90">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                    02
                  </span>
                  Большой выбор жанров и авторов
                </li>
                <li className="flex items-center gap-3 text-sm text-white/90">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                    03
                  </span>
                  Следим за популярными новинками каждый день
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <RecommendationDiscovery 
          genres={genresToShow} 
          onAddToCart={handleAddToCart}
          onToggleFavorite={handleToggleFavorite}
        />
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <TrendingBooks 
          onAddToCart={handleAddToCart}
          onToggleFavorite={handleToggleFavorite}
        />
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">Новинки</h2>
            <p className="text-sm text-neutral-500">
              Самые свежие издания этого месяца
            </p>
          </div>
          <Link
            to="/catalog?sort=newest"
            className="text-sm font-medium text-primary hover:underline"
          >
            Смотреть все
          </Link>
        </div>
        {newBooksLoading || (isFetchingNewBooks && !newBooks?.length) ? (
          <Loading message="Загружаем новинки..." />
        ) : newBooksError ? (
          <ErrorMessage
            description="Не удалось загрузить новинки."
            action={
              <Button variant="secondary" size="sm" onClick={() => refetchNewBooks()}>
                Повторить попытку
              </Button>
            }
          />
        ) : (newBooks ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-neutral-500">
            Пока нет новинок для отображения. Загляните позже или посмотрите каталог.
          </div>
        ) : (
          <RecommendationCarousel 
            books={newBooks ?? []} 
            onAddToCart={handleAddToCart}
            onToggleFavorite={handleToggleFavorite}
          />
        )}
      </section>

      {genresToShow.length > 0 && (
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">Популярные жанры</h2>
              <p className="text-sm text-neutral-500">
                Выбирайте настроение и находите новые истории
              </p>
            </div>
            <Link
              to="/catalog"
              className="text-sm font-medium text-primary hover:underline"
            >
              Весь каталог
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {genresToShow.map((genre) => (
              <Link
                key={genre}
                to={`/catalog?genres=${encodeURIComponent(genre)}`}
                className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 opacity-0 transition group-hover:opacity-100" />
                <div className="relative">
                  <span className="text-sm font-medium uppercase tracking-wide text-primary">
                    Жанр
                  </span>
                  <h3 className="mt-2 text-2xl font-semibold text-neutral-900">
                    {genre}
                  </h3>
                  <p className="mt-3 text-sm text-neutral-500">
                    Посмотрите подборку лучших книг в жанре {genre.toLowerCase()}.
                  </p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                    Открыть подборку
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default HomePage


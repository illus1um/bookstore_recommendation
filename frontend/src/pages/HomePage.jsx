import { ArrowRight, Sparkles, BookOpen, TrendingUp, Star, Users, ShoppingBag } from 'lucide-react'
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
import { useAuthStore } from '../store/authStore'

const HomePage = () => {
  const {
    data: newBooks,
    isLoading: newBooksLoading,
    isError: newBooksError,
    refetch: refetchNewBooks,
    isFetching: isFetchingNewBooks,
  } = useNewBooks({ limit: 12 })
  const { data: filters } = useBookFilters()
  const { handleAddToCart, handleToggleFavorite, isFavorite } = useCartActions()

  const genresToShow = (filters?.genres ?? []).slice(0, 6)

  const { isAuthenticated } = useAuthStore()

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-white">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            {/* Left Column - Content */}
            <div className="space-y-8 text-center lg:text-left">

              <div className="space-y-4">
                <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
                  Найдите свою{' '}
                  <span className="relative inline-block">
                    <span className="relative z-10">идеальную</span>
                    <span className="absolute bottom-2 left-0 right-0 h-3 bg-white/30 -skew-x-12" />
                  </span>{' '}
                  книгу
                </h1>
                <p className="text-lg leading-relaxed text-white/90 md:text-xl">
                  Персональные рекомендации, популярные новинки и огромный каталог — всё в одном месте. 
                  Откройте для себя истории, которые затронут ваше сердце.
                </p>
              </div>

              {/* Search Bar */}
              <div className="max-w-2xl">
                <SearchBar />
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button as={Link} to="/catalog" size="lg" className="shadow-xl">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Перейти в каталог
                </Button>
                <Link
                  to="/catalog?sort=popularity"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20 hover:border-white/50"
                >
                  <TrendingUp className="h-4 w-4" />
                  Популярные книги
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Right Column - Features Card */}
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl bg-white/10 blur-2xl" />
              <div className="relative rounded-3xl bg-white/10 p-8 shadow-2xl backdrop-blur-xl border border-white/20 lg:p-10">
                <div className="mb-6">
                  <p className="text-sm font-semibold uppercase tracking-wider text-white/80">
                    Почему выбирают нас
                  </p>
                </div>
                <ul className="space-y-4">
                  {[
                    { icon: Sparkles, text: 'Персональные рекомендации на основе ваших предпочтений' },
                    { icon: BookOpen, text: 'Огромный выбор жанров и авторов' },
                    { icon: TrendingUp, text: 'Следим за популярными новинками каждый день' },
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <p className="pt-2 text-sm leading-relaxed text-white/90">
                        {item.text}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recommendation Discovery Section */}
      <section className="bg-gradient-to-b from-white to-neutral-50/50 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
              <Sparkles className="h-4 w-4" />
              Персональные рекомендации
            </div>
            <h2 className="text-3xl font-bold text-neutral-900 md:text-4xl">
              {isAuthenticated ? 'Подборка специально для вас' : 'Откройте для себя новые истории'}
            </h2>
            <p className="mt-2 text-neutral-600">
              {isAuthenticated 
                ? 'Мы подобрали книги на основе ваших интересов и предпочтений'
                : 'Войдите в аккаунт, чтобы получать персональные рекомендации'}
            </p>
          </div>
          <RecommendationDiscovery 
            genres={genresToShow} 
            onAddToCart={handleAddToCart}
            onToggleFavorite={handleToggleFavorite}
            isFavorite={isFavorite}
          />
        </div>
      </section>

      {/* Trending Books Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 mb-3">
                <TrendingUp className="h-3 w-3" />
                Популярно сейчас
              </div>
              <h2 className="text-3xl font-bold text-neutral-900 md:text-4xl">
                Популярные книги
              </h2>
              <p className="mt-2 text-neutral-600">
                Самые просматриваемые и покупаемые книги на этой неделе
              </p>
            </div>
            <Link
              to="/catalog?sort=popularity"
              className="hidden items-center gap-2 text-sm font-medium text-primary hover:underline sm:flex"
            >
              Все популярные
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <TrendingBooks 
            onAddToCart={handleAddToCart}
            onToggleFavorite={handleToggleFavorite}
            isFavorite={isFavorite}
          />
        </div>
      </section>

      {/* New Books Section */}
      <section className="bg-gradient-to-b from-neutral-50/50 to-white py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 mb-3">
                <Star className="h-3 w-3" />
                Новое
              </div>
              <h2 className="text-3xl font-bold text-neutral-900 md:text-4xl">
                Новинки
              </h2>
              <p className="mt-2 text-neutral-600">
                Самые свежие издания этого месяца — будьте первыми, кто их прочитает
              </p>
            </div>
            <Link
              to="/catalog?sort=newest"
              className="hidden items-center gap-2 text-sm font-medium text-primary hover:underline sm:flex"
            >
              Все новинки
              <ArrowRight className="h-4 w-4" />
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
              isFavorite={isFavorite}
            />
          )}
        </div>
      </section>

      {/* Genres Section */}
      {genresToShow.length > 0 && (
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mb-10 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 mb-3">
                <BookOpen className="h-3 w-3" />
                Исследуйте жанры
              </div>
              <h2 className="text-3xl font-bold text-neutral-900 md:text-4xl">
                Популярные жанры
              </h2>
              <p className="mt-2 text-neutral-600">
                Выбирайте настроение и находите истории, которые вам по душе
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {genresToShow.map((genre, idx) => (
                <Link
                  key={genre}
                  to={`/catalog?genres=${encodeURIComponent(genre)}`}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-neutral-50/50 p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-neutral-100"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                      Жанр #{idx + 1}
                    </span>
                    <h3 className="mt-2 text-xl font-bold text-neutral-900 group-hover:text-primary transition-colors">
                      {genre}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                      Откройте для себя лучшие произведения в жанре {genre.toLowerCase()}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1">
                      Открыть подборку
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Button as={Link} to="/catalog" variant="secondary" size="lg">
                <BookOpen className="mr-2 h-5 w-5" />
                Посмотреть весь каталог
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Готовы начать читать?
            </h2>
            <p className="mt-4 text-lg text-white/90">
              Откройте для себя тысячи книг и найдите свою следующую любимую историю
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button as={Link} to="/catalog" size="lg" variant="secondary" className="shadow-xl">
                <ShoppingBag className="mr-2 h-5 w-5" />
                Перейти в каталог
              </Button>
              {!isAuthenticated && (
                <Button as={Link} to="/register" size="lg" className="bg-white/10 text-white border-2 border-white/30 hover:bg-white/20 backdrop-blur-sm">
                  <Users className="mr-2 h-5 w-5" />
                  Создать аккаунт
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage


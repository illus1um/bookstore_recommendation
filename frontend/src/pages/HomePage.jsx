import { ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import RecommendationCarousel from '../components/recommendations/RecommendationCarousel'
import TrendingBooks from '../components/recommendations/TrendingBooks'
import SearchBar from '../components/books/SearchBar'
import Button from '../components/common/Button'
import { usePersonalRecommendations } from '../hooks/useRecommendations'
import { useBookList } from '../hooks/useBooks'
import { useAuthStore } from '../store/authStore'
import Loading from '../components/common/Loading'

const HomePage = () => {
  const { isAuthenticated } = useAuthStore()
  const { data: recs, isLoading: recsLoading } = usePersonalRecommendations(
    isAuthenticated,
  )
  const { data: newBooks, isLoading: newBooksLoading } = useBookList({
    sort: 'newest',
    limit: 12,
  })

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
        <TrendingBooks />
      </section>

      {isAuthenticated && (
        <section className="container mx-auto px-4 py-12 md:py-16">
          {recsLoading ? (
            <Loading message="Подбираем рекомендации..." />
          ) : (
            <RecommendationCarousel
              books={recs}
              title="Рекомендовано для вас"
              subtitle="На основе ваших предпочтений и истории"
            />
          )}
        </section>
      )}

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">Новинки</h2>
            <p className="text-sm text-neutral-500">Самые свежие издания этого месяца</p>
          </div>
          <Link
            to="/catalog?sort=newest"
            className="text-sm font-medium text-primary hover:underline"
          >
            Смотреть все
          </Link>
        </div>
        {newBooksLoading ? (
          <Loading message="Загружаем новинки..." />
        ) : (
          <RecommendationCarousel books={newBooks?.items ?? newBooks ?? []} />
        )}
      </section>
    </div>
  )
}

export default HomePage


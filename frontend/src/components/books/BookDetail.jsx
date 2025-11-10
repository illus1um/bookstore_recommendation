import { useMemo, useState } from 'react'
import { Star, ShoppingCart, BookmarkPlus, Minus, Plus } from 'lucide-react'
import Button from '../common/Button'
import Loading from '../common/Loading'
import ErrorMessage from '../common/ErrorMessage'
import { formatPrice } from '../../utils/helpers'
import RecommendationCarousel from '../recommendations/RecommendationCarousel'
import { useSimilarBooks } from '../../hooks/useRecommendations'

const DetailRow = ({ label, value }) => (
  <div className="flex items-center justify-between border-b border-neutral-100 py-3 text-sm text-neutral-600">
    <span>{label}</span>
    <span className="font-medium text-neutral-900">{value}</span>
  </div>
)

const tabs = [
  { key: 'description', label: 'Описание' },
  { key: 'specs', label: 'Характеристики' },
  { key: 'reviews', label: 'Отзывы' },
]

const BookDetail = ({ book, onAddToCart, onLike }) => {
  const {
    data: similarData,
    isLoading: similarLoading,
    isError: similarError,
  } = useSimilarBooks(book?.id)
  const [activeTab, setActiveTab] = useState('description')
  const [quantity, setQuantity] = useState(1)

  if (!book) return null

  const stockState = useMemo(() => {
    if (!book.stock || book.stock <= 0) return { label: 'Нет в наличии', tone: 'text-red-500' }
    if (book.stock < 5) return { label: 'Осталось мало', tone: 'text-amber-500' }
    return { label: 'В наличии', tone: 'text-emerald-600' }
  }, [book.stock])

  const handleDecrease = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1))
  const handleIncrease = () => setQuantity((prev) => prev + 1)

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr,1.2fr]">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-3xl bg-white shadow-card">
          <img
            src={book.cover_image_url}
            alt={`Обложка ${book.title}`}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-card">
          <div className="flex items-center gap-3">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.key
                    ? 'bg-primary text-white shadow-card'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="mt-4">
            {activeTab === 'description' && (
              <p className="text-sm leading-relaxed text-neutral-600">{book.description}</p>
            )}
            {activeTab === 'specs' && (
              <div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-100 bg-neutral-50">
                <DetailRow label="Издательство" value={book.publisher} />
                <DetailRow label="Год издания" value={book.publication_year} />
                <DetailRow label="ISBN" value={book.isbn || '—'} />
                <DetailRow label="Язык" value={book.language?.toUpperCase()} />
                <DetailRow label="Количество страниц" value={book.page_count} />
              </div>
            )}
            {activeTab === 'reviews' && (
              <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500">
                Отзывы появятся здесь, как только читатели поделятся впечатлениями.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-card">
          <span className="text-sm font-medium uppercase tracking-wide text-primary">
            {book.genre}
          </span>
          <h1 className="mt-3 text-3xl font-semibold text-neutral-900 leading-tight">
            {book.title}
          </h1>
          <p className="mt-2 text-lg text-neutral-500">{book.author}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-neutral-500">
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 text-amber-400" />
              <span className="font-semibold text-neutral-900">
                {book.average_rating?.toFixed(1) ?? '—'}
              </span>
            </div>
            <span>•</span>
            <span>{book.page_count} страниц</span>
            <span>•</span>
            <span>{book.language?.toUpperCase()}</span>
            <span>•</span>
            <span className={`font-medium ${stockState.tone}`}>{stockState.label}</span>
          </div>
          <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-neutral-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-neutral-500">Цена</p>
              <p className="text-2xl font-semibold text-neutral-900">
                {formatPrice(book.price)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1">
                <button
                  type="button"
                  className="p-1 text-neutral-500 hover:text-primary"
                  onClick={handleDecrease}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-6 text-center text-sm font-semibold text-neutral-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  className="p-1 text-neutral-500 hover:text-primary"
                  onClick={handleIncrease}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<BookmarkPlus className="h-4 w-4" />}
                  onClick={() => onLike?.(book)}
                >
                  В избранное
                </Button>
                <Button
                  size="sm"
                  leftIcon={<ShoppingCart className="h-4 w-4" />}
                  disabled={book.stock <= 0}
                  onClick={() => onAddToCart?.(book, quantity)}
                >
                  В корзину
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-card">
          <h3 className="mb-4 text-lg font-semibold text-neutral-900">Похожие книги</h3>
          {similarLoading ? (
            <Loading message="Подбираем похожие книги..." />
          ) : similarError ? (
            <ErrorMessage description="Не удалось загрузить похожие книги." />
          ) : similarData?.length ? (
            <RecommendationCarousel books={similarData} />
          ) : (
            <p className="text-sm text-neutral-500">
              Пока нет похожих книг для отображения.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default BookDetail


import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, ShoppingCart, BookmarkPlus, Minus, Plus } from 'lucide-react'
import Button from '../common/Button'
import Loading from '../common/Loading'
import ErrorMessage from '../common/ErrorMessage'
import { formatPrice } from '../../utils/helpers'
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

const BookDetail = ({ book, onAddToCart, onLike, onAddToCartSimilar, onToggleFavoriteSimilar }) => {
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
    <div className="grid gap-6 lg:grid-cols-[400px,1fr] xl:grid-cols-[450px,1fr]">
      <div className="space-y-4">
        <div className="overflow-hidden rounded-2xl bg-white shadow-card">
          <img
            src={book.cover_image_url}
            alt={`Обложка ${book.title}`}
            className="h-auto w-full max-h-[600px] object-contain"
          />
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-card">
          <div className="flex items-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
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

      <div className="space-y-4">
        <div className="rounded-2xl bg-white p-5 shadow-card">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            {book.genre}
          </span>
          <h1 className="mt-2 text-xl font-bold text-neutral-900 leading-tight sm:text-2xl">
            {book.title}
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500 sm:text-base">{book.author}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-500 sm:gap-3 sm:text-sm">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-neutral-900">
                {book.average_rating?.toFixed(1) ?? '—'}
              </span>
            </div>
            <span className="text-neutral-300">•</span>
            <span>{book.page_count} стр.</span>
            <span className="text-neutral-300">•</span>
            <span>{book.language?.toUpperCase()}</span>
            <span className="text-neutral-300">•</span>
            <span className={`font-semibold ${stockState.tone}`}>{stockState.label}</span>
          </div>
          <div className="mt-5 space-y-4 rounded-2xl bg-gradient-to-br from-neutral-50 to-neutral-100/50 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Цена
                </p>
                <p className="mt-0.5 text-2xl font-extrabold text-neutral-900 sm:text-3xl">
                  {formatPrice(book.price)}
                </p>
              </div>
              <div className="flex items-center gap-1.5 self-start rounded-full border-2 border-neutral-200 bg-white px-2 py-1.5 shadow-sm sm:self-center">
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-600 transition hover:bg-primary hover:text-white active:scale-95"
                  onClick={handleDecrease}
                  aria-label="Уменьшить количество"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-8 text-center text-base font-bold text-neutral-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-600 transition hover:bg-primary hover:text-white active:scale-95"
                  onClick={handleIncrease}
                  aria-label="Увеличить количество"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                size="md"
                leftIcon={<ShoppingCart className="h-4 w-4" />}
                disabled={book.stock <= 0}
                onClick={() => onAddToCart?.(book, quantity)}
                className="col-span-full shadow-md transition-transform active:scale-[0.98]"
              >
                {book.stock <= 0 ? 'Нет в наличии' : 'В корзину'}
              </Button>
              <Button
                variant="secondary"
                size="md"
                leftIcon={<BookmarkPlus className="h-4 w-4" />}
                onClick={() => onLike?.(book)}
                className="col-span-full transition-transform active:scale-[0.98]"
              >
                Избранное
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-neutral-900">Вам может понравиться</h3>
              <p className="mt-0.5 text-xs text-neutral-500">Похожие книги по жанру и стилю</p>
            </div>
          </div>
          {similarLoading ? (
            <Loading message="Подбираем похожие книги..." />
          ) : similarError ? (
            <ErrorMessage description="Не удалось загрузить похожие книги." />
          ) : similarData?.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
              {similarData.slice(0, 8).map((similarBook) => (
                <div
                  key={similarBook.id}
                  className="group flex flex-col rounded-xl bg-neutral-50 p-3 transition hover:bg-neutral-100 hover:shadow-md"
                >
                  <Link to={`/books/${similarBook.id}`} className="block">
                    <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-neutral-200">
                      {similarBook.cover_image_url ? (
                        <img
                          src={similarBook.cover_image_url}
                          alt={similarBook.title}
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
                      {similarBook.title}
                    </h4>
                    <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">
                      {similarBook.author}
                    </p>
                  </Link>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-neutral-900">
                      {formatPrice(similarBook.price)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onAddToCartSimilar?.(similarBook)}
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
                Пока нет похожих книг для отображения.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BookDetail


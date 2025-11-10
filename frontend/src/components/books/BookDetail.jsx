import { Star, ShoppingCart, BookmarkPlus } from 'lucide-react'
import Button from '../common/Button'
import { formatPrice } from '../../utils/helpers'
import RecommendationCarousel from '../recommendations/RecommendationCarousel'
import { useSimilarBooks } from '../../hooks/useRecommendations'

const DetailRow = ({ label, value }) => (
  <div className="flex items-center justify-between border-b border-neutral-100 py-3 text-sm text-neutral-600">
    <span>{label}</span>
    <span className="font-medium text-neutral-900">{value}</span>
  </div>
)

const BookDetail = ({ book, onAddToCart, onLike }) => {
  const { data: similarData } = useSimilarBooks(book?.id)

  if (!book) return null

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
          <h4 className="text-lg font-semibold text-neutral-900">О книге</h4>
          <p className="mt-3 text-sm text-neutral-600 leading-relaxed">
            {book.description}
          </p>
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
          <div className="mt-4 flex items-center gap-4 text-neutral-500">
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
          </div>
          <div className="mt-6 flex items-center justify-between rounded-2xl bg-neutral-50 px-5 py-4">
            <div>
              <p className="text-sm text-neutral-500">Цена</p>
              <p className="text-2xl font-semibold text-neutral-900">
                {formatPrice(book.price)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="lg"
                leftIcon={<BookmarkPlus className="h-5 w-5" />}
                onClick={() => onLike?.(book)}
              >
                В избранное
              </Button>
              <Button
                size="lg"
                leftIcon={<ShoppingCart className="h-5 w-5" />}
                onClick={() => onAddToCart?.(book)}
              >
                В корзину
              </Button>
            </div>
          </div>

          <div className="mt-6 divide-y divide-neutral-100 rounded-2xl border border-neutral-100 bg-neutral-50">
            <DetailRow label="Издательство" value={book.publisher} />
            <DetailRow label="Год издания" value={book.publication_year} />
            <DetailRow label="ISBN" value={book.isbn || '—'} />
            <DetailRow label="Язык" value={book.language?.toUpperCase()} />
            <DetailRow label="В наличии" value={`${book.stock} шт.`} />
          </div>
        </div>

        {similarData?.length ? (
          <div className="rounded-3xl bg-white p-6 shadow-card">
            <h3 className="text-lg font-semibold text-neutral-900">Похожие книги</h3>
            <RecommendationCarousel books={similarData} />
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default BookDetail


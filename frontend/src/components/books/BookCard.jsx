import { Heart, Star } from 'lucide-react'
import Button from '../common/Button'
import { formatPrice } from '../../utils/helpers'
import clsx from 'clsx'

const BookCard = ({
  book,
  onAddToCart,
  onToggleFavorite,
  isFavorite = false,
  className,
}) => (
  <div className={clsx('flex flex-col rounded-2xl bg-white p-4 shadow-card', className)}>
    <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-neutral-100">
      {book.cover_image_url ? (
        <img
          src={book.cover_image_url}
          alt={`Обложка книги ${book.title}`}
          className="h-full w-full object-cover transition duration-300 hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-neutral-400">
          Нет изображения
        </div>
      )}
      <button
        type="button"
        onClick={() => onToggleFavorite?.(book)}
        className={clsx(
          'absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/90 text-neutral-500 shadow-card transition hover:scale-105',
          isFavorite && 'text-red-500',
        )}
        aria-label="Добавить в избранное"
      >
        <Heart className={clsx('h-5 w-5', isFavorite && 'fill-current')} />
      </button>
    </div>
    <div className="mt-4 flex flex-1 flex-col">
      <span className="text-xs font-medium uppercase tracking-wide text-primary">
        {book.genre}
      </span>
      <h3 className="mt-1 line-clamp-2 text-lg font-semibold text-neutral-900">
        {book.title}
      </h3>
      <p className="mt-1 text-sm text-neutral-500">{book.author}</p>
      <div className="mt-3 flex items-center gap-2 text-sm text-neutral-500">
        <Star className="h-4 w-4 text-amber-400" />
        <span>{book.average_rating?.toFixed(1) ?? '—'}</span>
        <span className="text-neutral-300">•</span>
        <span>{book.publication_year}</span>
      </div>
      <div className="mt-auto flex items-center justify-between pt-4">
        <span className="text-lg font-semibold text-neutral-900">
          {formatPrice(book.price)}
        </span>
        <Button size="sm" onClick={() => onAddToCart?.(book)}>
          В корзину
        </Button>
      </div>
    </div>
  </div>
)

export default BookCard


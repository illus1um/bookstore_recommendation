import { Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../common/Button'
import { formatPrice } from '../../utils/helpers'
import clsx from 'clsx'

const BookCard = ({
  book,
  onAddToCart,
  onToggleFavorite,
  isFavorite = false,
  className,
  compact = false,
}) => (
  <div className={clsx(
    'group flex flex-col rounded-xl bg-white shadow-sm transition hover:shadow-md',
    compact ? 'p-3' : 'p-4',
    className
  )}>
    <Link to={`/books/${book.id}`} className="relative block">
      <div className={clsx(
        'relative overflow-hidden rounded-lg bg-neutral-100',
        compact ? 'aspect-[2/3]' : 'aspect-[3/4]'
      )}>
      {book.cover_image_url ? (
        <img
          src={book.cover_image_url}
          alt={`Обложка книги ${book.title}`}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-neutral-400">
          Нет изображения
        </div>
      )}
      </div>
    </Link>
  
    <div className={clsx('flex flex-1 flex-col', compact ? 'mt-2' : 'mt-3')}>
      <Link to={`/books/${book.id}`}>
        <span className={clsx(
          'font-medium uppercase tracking-wide text-primary',
          compact ? 'text-[10px]' : 'text-xs'
        )}>
        {book.genre}
      </span>
        <h3 className={clsx(
          'mt-1 line-clamp-2 font-semibold text-neutral-900 transition group-hover:text-primary',
          compact ? 'text-sm leading-tight' : 'text-base'
        )}>
        {book.title}
      </h3>
        <p className={clsx('mt-0.5 text-neutral-500', compact ? 'text-xs' : 'text-sm')}>
          {book.author}
        </p>
      </Link>
      
      <div className={clsx(
        'flex items-center gap-1.5 text-neutral-500',
        compact ? 'mt-1.5 text-xs' : 'mt-2 text-sm'
      )}>
        <Star className={clsx('text-amber-400', compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
        <span>{book.average_rating?.toFixed(1) ?? '—'}</span>
        <span className="text-neutral-300">•</span>
        <span>{book.publication_year}</span>
      </div>
      
      <div className={clsx(
        'mt-auto',
        compact ? 'space-y-2 pt-2' : 'flex items-center justify-between pt-3'
      )}>
        {compact ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-neutral-900">
                {formatPrice(book.price)}
              </span>
            </div>
            <Button 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation()
                onAddToCart?.(book)
              }}
              className="w-full px-2 py-1.5 text-xs"
            >
              Купить
            </Button>
          </>
        ) : (
          <>
            <span className="text-base font-bold text-neutral-900">
          {formatPrice(book.price)}
        </span>
            <Button 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation()
                onAddToCart?.(book)
              }}
            >
          В корзину
        </Button>
          </>
        )}
      </div>
    </div>
  </div>
)

export default BookCard


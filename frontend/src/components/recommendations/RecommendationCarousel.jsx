import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef } from 'react'
import BookCard from '../books/BookCard'

const RecommendationCarousel = ({ 
  books = [], 
  title, 
  subtitle, 
  onAddToCart, 
  onToggleFavorite 
}) => {
  const scrollRef = useRef(null)

  const scroll = (direction) => {
    if (!scrollRef.current) return
    const { clientWidth } = scrollRef.current
    scrollRef.current.scrollBy({
      left: direction === 'next' ? clientWidth : -clientWidth,
      behavior: 'smooth',
    })
  }

  if (!books.length) {
    return null
  }

  return (
    <section className="relative">
      <div className="mb-4 flex items-center justify-between">
        <div>
          {title && <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>}
          {subtitle && <p className="text-sm text-neutral-500">{subtitle}</p>}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scroll('prev')}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 hover:border-primary hover:text-primary"
            aria-label="Предыдущие"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll('next')}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 hover:border-primary hover:text-primary"
            aria-label="Следующие"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4"
      >
        {books.map((book) => (
          <div
            key={book.id}
            className="min-w-[240px] snap-center lg:min-w-[260px]"
          >
            <BookCard 
              book={book} 
              onAddToCart={onAddToCart}
              onToggleFavorite={onToggleFavorite}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

export default RecommendationCarousel


import BookCard from './BookCard'
import Loading from '../common/Loading'
import ErrorMessage from '../common/ErrorMessage'

const BookGrid = ({
  books = [],
  isLoading,
  isError,
  errorMessage,
  onAddToCart,
  onToggleFavorite,
  favorites = [],
}) => {
  if (isLoading) {
    return <Loading message="Загружаем книги..." />
  }

  if (isError) {
    return <ErrorMessage description={errorMessage} />
  }

  if (!books.length) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-10 text-center text-neutral-500">
        Книги не найдены. Попробуйте изменить фильтры.
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          onAddToCart={onAddToCart}
          onToggleFavorite={onToggleFavorite}
          isFavorite={favorites.includes(book.id)}
        />
      ))}
    </div>
  )
}

export default BookGrid


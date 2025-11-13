import clsx from 'clsx'
import Button from '../common/Button'
import { formatPrice } from '../../utils/helpers'

const headers = [
  { key: 'title', label: 'Название' },
  { key: 'author', label: 'Автор' },
  { key: 'genre', label: 'Жанр' },
  { key: 'price', label: 'Цена' },
  { key: 'stock', label: 'Остаток' },
  { key: 'average_rating', label: 'Рейтинг' },
  { key: 'created_at', label: 'Добавлена' },
]

const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const BookTable = ({ books = [], onEdit, onDelete, isDeletingId }) => {
  if (!books.length) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-12 text-center text-neutral-500">
        В каталоге пока нет книг. Добавьте первую!
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-card">
      <div className="max-h-[70vh] overflow-auto">
        <table className="min-w-full divide-y divide-neutral-100 text-sm">
          <thead className="sticky top-0 z-10 bg-neutral-50 text-left text-neutral-500 shadow-xs">
            <tr>
              {headers.map((header) => (
                <th key={header.key} className="px-4 py-3 font-medium">
                  {header.label}
                </th>
              ))}
              <th className="px-4 py-3 text-right font-medium">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {books.map((book) => {
              const stock = book.stock ?? 0
              const isOutOfStock = stock === 0
              const isLowStock = stock > 0 && stock < 5

              return (
                <tr
                  key={book.id}
                  className={clsx(
                    'transition hover:bg-neutral-50/80',
                    isOutOfStock && 'bg-red-50/50',
                    !isOutOfStock && isLowStock && 'bg-amber-50/40',
                  )}
                >
                  <td className="px-4 py-3 font-medium text-neutral-900">{book.title}</td>
                  <td className="px-4 py-3 text-neutral-600">{book.author}</td>
                  <td className="px-4 py-3 text-neutral-600">{book.genre}</td>
                  <td className="px-4 py-3 text-neutral-900">{formatPrice(book.price)}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    <span
                      className={clsx(
                        'inline-flex min-w-[60px] justify-center rounded-full px-2 py-1 text-xs font-medium',
                        isOutOfStock
                          ? 'bg-red-100 text-red-700'
                          : isLowStock
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700',
                      )}
                    >
                      {stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {book.average_rating ? book.average_rating.toFixed(1) : '—'}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{formatDate(book.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" size="sm" onClick={() => onEdit(book)}>
                        Редактировать
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(book)}
                        isLoading={isDeletingId === book.id}
                      >
                        Удалить
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default BookTable

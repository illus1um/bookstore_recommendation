import Button from '../common/Button'
import { formatPrice } from '../../utils/helpers'

const headers = [
  { key: 'title', label: 'Название' },
  { key: 'author', label: 'Автор' },
  { key: 'genre', label: 'Жанр' },
  { key: 'price', label: 'Цена' },
  { key: 'stock', label: 'Остаток' },
]

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
      <table className="min-w-full divide-y divide-neutral-100 text-sm">
        <thead className="bg-neutral-50 text-left text-neutral-500">
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
          {books.map((book) => (
            <tr key={book.id} className="hover:bg-neutral-50/60">
              <td className="px-4 py-3 font-medium text-neutral-900">{book.title}</td>
              <td className="px-4 py-3 text-neutral-600">{book.author}</td>
              <td className="px-4 py-3 text-neutral-600">{book.genre}</td>
              <td className="px-4 py-3 text-neutral-900">
                {formatPrice(book.price)}
              </td>
              <td className="px-4 py-3 text-neutral-600">{book.stock}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onEdit(book)}
                  >
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
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default BookTable


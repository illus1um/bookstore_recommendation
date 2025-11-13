import clsx from 'clsx'
import Modal from '../common/Modal'
import BookForm from './BookForm'
import { formatPrice } from '../../utils/helpers'

const BookEditModal = ({
  book,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  if (!book) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Редактирование книги"
      description={`ID: ${book.id}`}
      size="full"
    >
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="lg:w-2/5">
          <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50">
            <div className="aspect-[3/4] bg-neutral-100">
              {book.cover_image_url ? (
                <img
                  src={book.cover_image_url}
                  alt={book.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
                  Нет изображения
                </div>
              )}
            </div>
            <div className="space-y-4 p-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-400">
                  Название
                </p>
                <p className="mt-1 text-lg font-semibold text-neutral-900">
                  {book.title}
                </p>
              </div>
              <div className="grid gap-3 text-sm text-neutral-600">
                <InfoRow label="Автор" value={book.author} />
                <InfoRow label="Жанр" value={book.genre} />
                <InfoRow label="Издательство" value={book.publisher} />
                <InfoRow
                  label="Год издания"
                  value={book.publication_year}
                />
                <InfoRow
                  label="Цена"
                  value={formatPrice(book.price)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="default">
                  Остаток: {book.stock ?? 0}
                </Badge>
                {book.average_rating ? (
                  <Badge tone="primary">
                    Рейтинг: {book.average_rating.toFixed(1)}
                  </Badge>
                ) : null}
                {book.tags?.map((tag) => (
                  <Badge key={tag} tone="soft">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:w-3/5">
          <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-inner">
            <BookForm
              initialData={book}
              onSubmit={onSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-xs uppercase tracking-wide text-neutral-400">
      {label}
    </span>
    <span className="text-sm font-medium text-neutral-800">
      {value ?? '—'}
    </span>
  </div>
)

const Badge = ({ children, tone = 'default' }) => {
  const styles = {
    default: 'bg-neutral-100 text-neutral-600',
    primary: 'bg-primary/10 text-primary',
    soft: 'bg-neutral-50 text-neutral-500 border border-neutral-200',
  }
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
        styles[tone] ?? styles.default,
      )}
    >
      {children}
    </span>
  )
}

export default BookEditModal



import { useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import BookForm from '../components/admin/BookForm'
import BookTable from '../components/admin/BookTable'
import Loading from '../components/common/Loading'
import ErrorMessage from '../components/common/ErrorMessage'
import { useBookList, useBookMutations } from '../hooks/useBooks'

const AdminDashboardPage = () => {
  const [editingBook, setEditingBook] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const { data, isLoading, isError } = useBookList({ limit: 200 })
  const { createBook, updateBook, deleteBook, statuses } = useBookMutations()

  const books = useMemo(() => {
    if (!data) return []
    if (Array.isArray(data)) return data
    return data.items || data.results || []
  }, [data])

  const handleCreateOrUpdate = async (payload, { reset }) => {
    try {
      if (editingBook) {
        await updateBook({ bookId: editingBook.id, data: payload })
        toast.success('Книга обновлена')
      } else {
        await createBook(payload)
        toast.success('Книга добавлена')
      }
      reset()
      setEditingBook(null)
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        'Не удалось сохранить книгу. Проверьте данные.'
      toast.error(message)
    }
  }

  const handleDelete = async (book) => {
    if (!window.confirm(`Удалить книгу «${book.title}»?`)) return
    try {
      setDeletingId(book.id)
      await deleteBook(book.id)
      toast.success('Книга удалена')
      if (editingBook?.id === book.id) {
        setEditingBook(null)
      }
    } catch {
      toast.error('Не удалось удалить книгу')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="flex flex-col gap-8">
        <section className="rounded-3xl bg-white p-8 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">
                Админ-панель
              </h1>
              <p className="mt-2 text-sm text-neutral-500">
                Управление каталогом: добавление, редактирование и удаление книг.
              </p>
            </div>
            {editingBook ? (
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => setEditingBook(null)}
              >
                Создать новую книгу
              </button>
            ) : null}
          </div>
          <div className="mt-6">
            <BookForm
              initialData={editingBook}
              onSubmit={handleCreateOrUpdate}
              isSubmitting={statuses.create === 'pending' || statuses.update === 'pending'}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900">Каталог</h2>
          {isLoading ? (
            <Loading message="Загружаем книги..." />
          ) : isError ? (
            <ErrorMessage description="Не удалось загрузить список книг." />
          ) : (
            <BookTable
              books={books}
              onEdit={setEditingBook}
              onDelete={handleDelete}
              isDeletingId={deletingId}
            />
          )}
        </section>
      </div>
    </div>
  )
}

export default AdminDashboardPage


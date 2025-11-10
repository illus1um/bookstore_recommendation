import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import Loading from '../components/common/Loading'
import ErrorMessage from '../components/common/ErrorMessage'
import BookDetail from '../components/books/BookDetail'
import { useBook } from '../hooks/useBooks'
import { useTrackView } from '../hooks/useInteractions'
import { INTERACTION_TYPES } from '../utils/constants'
import { useAuthStore } from '../store/authStore'
import { useInteractions } from '../hooks/useInteractions'

const BookDetailPage = () => {
  const { bookId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { data: book, isLoading, isError } = useBook(bookId)
  const { createInteraction } = useInteractions()

  useTrackView(bookId, Boolean(isAuthenticated && bookId))

  const requireAuth = () => {
    if (!isAuthenticated) {
      toast.error('Необходимо войти в аккаунт')
      navigate('/login', { replace: false })
      return false
    }
    return true
  }

  const handleAddToCart = async (item) => {
    if (!requireAuth()) return
    await createInteraction({
      book_id: item.id,
      interaction_type: INTERACTION_TYPES.CART,
      metadata: { quantity: 1 },
    })
    toast.success('Книга добавлена в корзину')
  }

  const handleLike = async (item) => {
    if (!requireAuth()) return
    await createInteraction({
      book_id: item.id,
      interaction_type: INTERACTION_TYPES.LIKE,
    })
    toast.success('Книга добавлена в избранное')
  }

  if (isLoading) return <Loading message="Загружаем книгу..." />
  if (isError || !book)
    return <ErrorMessage description="Не удалось загрузить информацию о книге." />

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <BookDetail book={book} onAddToCart={handleAddToCart} onLike={handleLike} />
    </div>
  )
}

export default BookDetailPage


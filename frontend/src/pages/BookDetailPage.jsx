import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import Loading from '../components/common/Loading'
import ErrorMessage from '../components/common/ErrorMessage'
import BookDetail from '../components/books/BookDetail'
import { useBook } from '../hooks/useBooks'
import { useTrackView, useInteractions } from '../hooks/useInteractions'
import { INTERACTION_TYPES } from '../utils/constants'
import { useAuthStore } from '../store/authStore'
import { useCart } from '../hooks/useCart'
import useUIStore from '../store/uiStore'

const BookDetailPage = () => {
  const { bookId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { data: book, isLoading, isError } = useBook(bookId)
  const { createInteraction } = useInteractions()
  const { addToCart } = useCart()
  const { openCart } = useUIStore()

  useTrackView(bookId, Boolean(isAuthenticated && bookId))

  const requireAuth = () => {
    if (!isAuthenticated) {
      toast.error('Необходимо войти в аккаунт')
      navigate('/login', { replace: false })
      return false
    }
    return true
  }

  const handleAddToCart = async (item, quantity) => {
    if (!requireAuth()) return
    try {
      await addToCart({ book_id: item.id, quantity })
      openCart()
    } catch (error) {
      console.error('Ошибка добавления в корзину:', error)
    }
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

  const handleAddToCartSimilar = async (book) => {
    if (!requireAuth()) return
    try {
      await addToCart({ book_id: book.id, quantity: 1 })
      openCart()
    } catch (error) {
      console.error('Ошибка добавления в корзину:', error)
    }
  }

  const handleToggleFavoriteSimilar = (book) => {
    if (!requireAuth()) return
    toast.info('Функция избранного в разработке')
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <BookDetail 
        book={book} 
        onAddToCart={handleAddToCart} 
        onLike={handleLike}
        onAddToCartSimilar={handleAddToCartSimilar}
        onToggleFavoriteSimilar={handleToggleFavoriteSimilar}
      />
    </div>
  )
}

export default BookDetailPage


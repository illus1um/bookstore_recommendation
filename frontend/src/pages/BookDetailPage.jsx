import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import Loading from '../components/common/Loading'
import ErrorMessage from '../components/common/ErrorMessage'
import BookDetail from '../components/books/BookDetail'
import { useBook } from '../hooks/useBooks'
import { useTrackView } from '../hooks/useInteractions'
import { useAuthStore } from '../store/authStore'
import { useCartActions } from '../hooks/useCartActions'
import { useCart } from '../hooks/useCart'
import useUIStore from '../store/uiStore'

const BookDetailPage = () => {
  const { bookId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { data: book, isLoading, isError } = useBook(bookId)
  const { handleAddToCart: handleAddToCartAction, handleToggleFavorite, isFavorite } = useCartActions()
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
    await handleToggleFavorite(item)
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

  const handleToggleFavoriteSimilar = async (book) => {
    if (!requireAuth()) return
    await handleToggleFavorite(book)
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <BookDetail 
        book={book} 
        onAddToCart={handleAddToCart} 
        onLike={handleLike}
        isFavorite={isFavorite?.(book.id) || false}
        onAddToCartSimilar={handleAddToCartSimilar}
        onToggleFavoriteSimilar={handleToggleFavoriteSimilar}
      />
    </div>
  )
}

export default BookDetailPage


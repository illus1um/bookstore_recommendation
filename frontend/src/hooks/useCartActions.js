import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useCart } from './useCart'
import { useAuthStore } from '../store/authStore'
import useUIStore from '../store/uiStore'
import { useFavorites } from './useInteractions'

export const useCartActions = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { addToCart } = useCart()
  const { openCart } = useUIStore()
  const { toggleFavorite, isFavorite } = useFavorites()

  const handleAddToCart = async (book, quantity = 1) => {
    if (!isAuthenticated) {
      toast.error('Необходимо войти в аккаунт')
      navigate('/login')
      return
    }

    try {
      await addToCart({ book_id: book.id, quantity })
      openCart()
    } catch (error) {
      console.error('Ошибка добавления в корзину:', error)
    }
  }

  const handleToggleFavorite = async (book) => {
    if (!isAuthenticated) {
      toast.error('Необходимо войти в аккаунт')
      navigate('/login')
      return
    }
    await toggleFavorite(book.id)
  }

  return {
    handleAddToCart,
    handleToggleFavorite,
    isFavorite,
  }
}

export default useCartActions


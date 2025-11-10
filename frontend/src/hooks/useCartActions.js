import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useCart } from './useCart'
import { useAuthStore } from '../store/authStore'
import useUIStore from '../store/uiStore'

export const useCartActions = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { addToCart } = useCart()
  const { openCart } = useUIStore()

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

  const handleToggleFavorite = (book) => {
    if (!isAuthenticated) {
      toast.error('Необходимо войти в аккаунт')
      navigate('/login')
      return
    }
    // TODO: реализовать избранное
    toast.info('Функция избранного в разработке')
  }

  return {
    handleAddToCart,
    handleToggleFavorite,
  }
}

export default useCartActions


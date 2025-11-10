import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import cartApi from '../api/cart'

export const cartKeys = {
  root: ['cart'],
}

export const useCart = () => {
  const queryClient = useQueryClient()

  const cartQuery = useQuery({
    queryKey: cartKeys.root,
    queryFn: async () => {
      const response = await cartApi.getCart()
      return response.data
    },
    staleTime: 1000 * 30,
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: cartKeys.root })

  const addMutation = useMutation({
    mutationFn: (payload) => cartApi.addToCart(payload),
    onSuccess: (response) => {
      queryClient.setQueryData(cartKeys.root, response.data)
      toast.success('Товар добавлен в корзину')
    },
    onError: () => {
      toast.error('Не удалось добавить товар в корзину')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ bookId, quantity }) =>
      cartApi.updateItem(bookId, { quantity }),
    onSuccess: () => invalidate(),
    onError: () => toast.error('Не удалось обновить корзину'),
  })

  const removeMutation = useMutation({
    mutationFn: (bookId) => cartApi.removeItem(bookId),
    onSuccess: () => {
      invalidate()
      toast.success('Товар удалён из корзины')
    },
    onError: () => toast.error('Не удалось удалить товар'),
  })

  const clearMutation = useMutation({
    mutationFn: () => cartApi.clearCart(),
    onSuccess: () => {
      invalidate()
      toast.success('Корзина очищена')
    },
    onError: () => toast.error('Не удалось очистить корзину'),
  })

  return {
    cart: cartQuery.data,
    isLoading: cartQuery.isLoading,
    addToCart: addMutation.mutateAsync,
    updateItem: updateMutation.mutateAsync,
    removeItem: removeMutation.mutateAsync,
    clearCart: clearMutation.mutateAsync,
    refreshCart: invalidate,
  }
}


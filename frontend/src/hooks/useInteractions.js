import { useCallback, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import interactionsApi from '../api/interactions'
import { INTERACTION_TYPES } from '../utils/constants'
import { useAuthStore } from '../store/authStore'

export const interactionKeys = {
  all: ['interactions'],
  user: (userId) => [...interactionKeys.all, 'user', userId],
  admin: ['interactions', 'admin'],
  adminList: (params) => [...interactionKeys.admin, 'list', params],
}

export const useInteractions = ({ fetch = false, userId: overrideUserId } = {}) => {
  const queryClient = useQueryClient()
  const authUser = useAuthStore((state) => state.user)
  const userId = overrideUserId || authUser?.id

  const listQuery = useQuery({
    queryKey: interactionKeys.user(userId),
    queryFn: async () => {
      const response = await interactionsApi.getUserInteractions(userId)
      return response.data
    },
    enabled: Boolean(fetch && userId),
  })

  const mutation = useMutation({
    mutationFn: async (payload) => {
      const response = await interactionsApi.createInteraction(payload)
      return response.data
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: interactionKeys.user(userId) })
      }
    },
    onError: (error) => {
      // Показываем ошибку только для явных действий пользователя (не для автоматического VIEW)
      console.error('Ошибка сохранения взаимодействия:', error)
    },
  })

  const createInteraction = useCallback(
    async (interaction, options = {}) => {
      try {
        return await mutation.mutateAsync({
          ...interaction,
          metadata: interaction.metadata ?? {},
        })
      } catch (error) {
        // Показываем toast только если это не скрытое действие
        if (!options.silent) {
          toast.error('Не удалось сохранить взаимодействие.')
        }
        throw error
      }
    },
    [mutation],
  )

  const trackView = useCallback(
    async (bookId) => {
      if (!bookId) return
      try {
        // Тихое отслеживание просмотров без показа ошибок пользователю
        await createInteraction(
          {
            book_id: bookId,
            interaction_type: INTERACTION_TYPES.VIEW,
          },
          { silent: true }
        )
      } catch (error) {
        // Игнорируем ошибки для просмотров
        console.debug('Не удалось записать просмотр:', error)
      }
    },
    [createInteraction],
  )

  return {
    interactions: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    createInteraction,
    trackView,
    mutationStatus: mutation.status,
  }
}

export const useTrackView = (bookId, enabled = true) => {
  const { trackView } = useInteractions()

  useEffect(() => {
    if (!enabled || !bookId) return
    
    // Защита от повторных вызовов: отслеживаем только один раз
    let cancelled = false
    
    const track = async () => {
      if (cancelled) return
      await trackView(bookId)
    }
    
    track()
    
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, enabled])
}

export default useInteractions

export const useAdminInteractions = (params) =>
  useQuery({
    queryKey: interactionKeys.adminList(params),
    queryFn: async () => {
      const response = await interactionsApi.getAdminInteractions(params)
      return response.data
    },
    staleTime: 1000 * 15,
  })

export const useFavorites = () => {
  const queryClient = useQueryClient()
  const { isAuthenticated, user } = useAuthStore()

  const favoritesQuery = useQuery({
    queryKey: [...interactionKeys.all, 'likes', user?.id],
    queryFn: async () => {
      const response = await interactionsApi.getUserLikes()
      return new Set(response.data) // Возвращаем Set для быстрой проверки
    },
    enabled: Boolean(isAuthenticated && user?.id),
    staleTime: 1000 * 30, // 30 секунд
  })

  const toggleLikeMutation = useMutation({
    mutationFn: async (bookId) => {
      const response = await interactionsApi.toggleLike(bookId)
      // Если статус 204, лайк удален, иначе добавлен
      const added = response.status !== 204 && Boolean(response.data)
      return { bookId, added }
    },
    onSuccess: (data) => {
      // Инвалидируем кэш лайков
      queryClient.invalidateQueries({ queryKey: [...interactionKeys.all, 'likes'] })
      // Инвалидируем все взаимодействия пользователя
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: interactionKeys.user(user.id) })
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Не удалось изменить статус избранного')
    },
  })

  const toggleFavorite = useCallback(
    async (bookId) => {
      if (!isAuthenticated) {
        toast.error('Необходимо войти в аккаунт')
        return false
      }
      try {
        const result = await toggleLikeMutation.mutateAsync(bookId)
        if (result.added) {
          toast.success('Книга добавлена в избранное')
        } else {
          toast.success('Книга удалена из избранного')
        }
        return result.added
      } catch (error) {
        return false
      }
    },
    [isAuthenticated, toggleLikeMutation]
  )

  const isFavorite = useCallback(
    (bookId) => {
      if (!bookId || !favoritesQuery.data) return false
      return favoritesQuery.data.has(bookId)
    },
    [favoritesQuery.data]
  )

  return {
    favorites: favoritesQuery.data ?? new Set(),
    isLoading: favoritesQuery.isLoading,
    isFavorite,
    toggleFavorite,
    isToggling: toggleLikeMutation.isPending,
  }
}


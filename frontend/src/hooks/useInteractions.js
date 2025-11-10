import { useCallback, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import interactionsApi from '../api/interactions'
import { INTERACTION_TYPES } from '../utils/constants'
import { useAuthStore } from '../store/authStore'

export const interactionKeys = {
  all: ['interactions'],
  user: (userId) => [...interactionKeys.all, 'user', userId],
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
    onError: () => {
      toast.error('Не удалось сохранить взаимодействие.')
    },
  })

  const createInteraction = useCallback(
    (interaction) =>
      mutation.mutateAsync({
        metadata: {},
        ...interaction,
      }),
    [mutation],
  )

  const trackView = useCallback(
    (bookId) => {
      if (!bookId) return
      createInteraction({
        book_id: bookId,
        interaction_type: INTERACTION_TYPES.VIEW,
      })
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
    trackView(bookId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, enabled])
}

export default useInteractions


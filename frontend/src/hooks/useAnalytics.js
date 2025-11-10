import { useQuery } from '@tanstack/react-query'
import analyticsApi from '../api/analytics'

export const analyticsKeys = {
  root: ['analytics'],
  userBehavior: () => [...analyticsKeys.root, 'user-behavior'],
}

export const useUserBehaviorAnalytics = () =>
  useQuery({
    queryKey: analyticsKeys.userBehavior(),
    queryFn: async () => {
      const response = await analyticsApi.getUserBehavior()
      return response.data
    },
    staleTime: 1000 * 60 * 5,
  })


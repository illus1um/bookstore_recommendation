import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import adminApi from '../api/admin'

export const adminUsersKeys = {
  root: ['admin', 'users'],
  list: (params) => [...adminUsersKeys.root, 'list', params],
}

export const useAdminUsers = (params) =>
  useQuery({
    queryKey: adminUsersKeys.list(params),
    queryFn: async () => {
      const response = await adminApi.listUsers(params)
      return response.data
    },
    staleTime: 1000 * 30,
  })

export const useUpdateAdminUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, data }) => adminApi.updateUser(userId, data),
    onSuccess: () => {
      toast.success('Пользователь обновлён')
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.root })
    },
    onError: () => toast.error('Не удалось обновить пользователя'),
  })
}

export const useDeleteAdminUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId) => adminApi.deleteUser(userId),
    onSuccess: () => {
      toast.success('Пользователь удалён')
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.root })
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Не удалось удалить пользователя'
      toast.error(message)
    },
  })
}


import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import authApi from '../api/auth'
import { useAuthStore } from '../store/authStore'

export const AUTH_QUERY_KEY = ['auth', 'me']

export const useAuth = () => {
  const queryClient = useQueryClient()
  const { user, token, isAuthenticated, setCredentials, updateUser, logout } =
    useAuthStore()

  const meQuery = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      const response = await authApi.me()
      return response.data
    },
    enabled: Boolean(token),
    staleTime: 1000 * 60 * 5,
    onSuccess: (data) => updateUser(data),
    retry: false,
  })

  const loginMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await authApi.login(payload)
      return response.data
    },
    onSuccess: async (data) => {
      setCredentials({ token: data.access_token })
      toast.success('Добро пожаловать!')
      const profile = await authApi.me().then((res) => res.data)
      setCredentials({ user: profile })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY })
    },
    onError: (error) => {
      const message =
        error.response?.data?.detail || 'Не удалось войти. Проверьте данные.'
      toast.error(message)
    },
  })

  const registerMutation = useMutation({
    mutationFn: (data) => authApi.register(data),
    onSuccess: () => {
      toast.success('Регистрация прошла успешно!')
    },
    onError: (error) => {
      const message = error.response?.data?.detail || 'Ошибка регистрации.'
      toast.error(message)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      logout()
      queryClient.clear()
    },
  })

  useEffect(() => {
    if (!token) {
      queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY })
    }
  }, [token, queryClient])

  return {
    user,
    token,
    isAuthenticated,
    updateUser,
    login: loginMutation.mutateAsync,
    loginStatus: loginMutation.status,
    register: registerMutation.mutateAsync,
    registerStatus: registerMutation.status,
    logout: () => logoutMutation.mutateAsync(),
    logoutStatus: logoutMutation.status,
    meQuery,
  }
}

export default useAuth


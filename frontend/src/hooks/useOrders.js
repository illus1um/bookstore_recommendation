import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import ordersApi from '../api/orders'

export const ordersKeys = {
  root: ['orders'],
  list: (params) => [...ordersKeys.root, 'list', params],
  detail: (id) => [...ordersKeys.root, 'detail', id],
  admin: ['orders', 'admin'],
  adminList: (params) => [...ordersKeys.admin, 'list', params],
}

export const useOrders = (params) =>
  useQuery({
    queryKey: ordersKeys.list(params),
    queryFn: async () => {
      const response = await ordersApi.getOrders(params)
      // Backend возвращает OrderListResponse с полем items
      return response.data.items || []
    },
    staleTime: 1000 * 30, // 30 секунд
  })

export const useOrder = (orderId) =>
  useQuery({
    queryKey: ordersKeys.detail(orderId),
    queryFn: async () => {
      const response = await ordersApi.getOrder(orderId)
      return response.data
    },
    enabled: Boolean(orderId),
  })

export const useCreateOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload) => {
      console.log('useCreateOrder: отправка запроса с payload:', payload)
      const response = await ordersApi.createOrder(payload)
      console.log('useCreateOrder: ответ сервера:', response)
      return response.data
    },
    onSuccess: (data) => {
      console.log('useCreateOrder: успех, данные:', data)
      // Инвалидируем кэш заказов и корзины
      queryClient.invalidateQueries({ queryKey: ordersKeys.root })
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
    onError: (error) => {
      console.error('useCreateOrder: ошибка:', error)
      console.error('useCreateOrder: детали:', error.response?.data)
    },
  })
}

export const useCancelOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId) => ordersApi.cancelOrder(orderId),
    onSuccess: (response) => {
      toast.success('Заказ отменён')
      queryClient.invalidateQueries({ queryKey: ordersKeys.root })
      return response.data
    },
    onError: () => toast.error('Не удалось отменить заказ'),
  })
}

export const useAdminOrders = (params) =>
  useQuery({
    queryKey: ordersKeys.adminList(params),
    queryFn: async () => {
      const response = await ordersApi.getAdminOrders(params)
      return response.data
    },
    staleTime: 1000 * 15,
  })

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, status }) =>
      ordersApi.updateOrderStatus(orderId, { status }),
    onSuccess: () => {
      toast.success('Статус заказа обновлён')
      queryClient.invalidateQueries({ queryKey: ordersKeys.admin })
      queryClient.invalidateQueries({ queryKey: ordersKeys.root })
    },
    onError: () => toast.error('Не удалось обновить статус заказа'),
  })
}


import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import ordersApi from '../api/orders'

export const ordersKeys = {
  root: ['orders'],
  list: (params) => [...ordersKeys.root, 'list', params],
  detail: (id) => [...ordersKeys.root, 'detail', id],
}

export const useOrders = (params) =>
  useQuery({
    queryKey: ordersKeys.list(params),
    queryFn: async () => {
      const response = await ordersApi.getOrders(params)
      return response.data
    },
    keepPreviousData: true,
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
    mutationFn: (payload) => ordersApi.createOrder(payload),
    onSuccess: (response) => {
      toast.success('Заказ успешно оформлен')
      queryClient.invalidateQueries({ queryKey: ordersKeys.root })
      return response.data
    },
    onError: () => toast.error('Не удалось оформить заказ'),
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


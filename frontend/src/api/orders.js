import axiosInstance from './axios'

const ORDERS_BASE = '/api/v1/orders'

export const ordersApi = {
  createOrder: (payload) => axiosInstance.post(ORDERS_BASE, payload),
  getOrders: (params = {}) => axiosInstance.get(ORDERS_BASE, { params }),
  getOrder: (orderId) => axiosInstance.get(`${ORDERS_BASE}/${orderId}`),
  cancelOrder: (orderId) => axiosInstance.put(`${ORDERS_BASE}/${orderId}/cancel`),
  getAdminOrders: (params = {}) => axiosInstance.get(`${ORDERS_BASE}/admin`, { params }),
  updateOrderStatus: (orderId, payload) =>
    axiosInstance.patch(`${ORDERS_BASE}/${orderId}/status`, payload),
}

export default ordersApi


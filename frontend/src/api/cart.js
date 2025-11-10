import axiosInstance from './axios'

const CART_BASE = '/api/v1/cart'

export const cartApi = {
  getCart: () => axiosInstance.get(`${CART_BASE}/`),
  addToCart: (payload) => axiosInstance.post(`${CART_BASE}/add`, payload),
  updateItem: (bookId, payload) =>
    axiosInstance.put(`${CART_BASE}/update/${bookId}`, payload),
  removeItem: (bookId) => axiosInstance.delete(`${CART_BASE}/${bookId}`),
  clearCart: () => axiosInstance.delete(`${CART_BASE}/clear`),
}

export default cartApi

